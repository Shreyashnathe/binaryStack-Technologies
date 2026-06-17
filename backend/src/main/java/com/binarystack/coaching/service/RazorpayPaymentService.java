package com.binarystack.coaching.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.Locale;
import java.util.Map;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.util.List;
import com.binarystack.coaching.dto.EnrollmentDto;
import com.binarystack.coaching.dto.RazorpayOrderRequest;
import com.binarystack.coaching.dto.RazorpayOrderResponse;
import com.binarystack.coaching.dto.RazorpayVerifyRequest;
import com.binarystack.coaching.dto.RazorpayCartOrderResponse;
import com.binarystack.coaching.dto.RazorpayCartVerifyRequest;
import com.binarystack.coaching.entity.Course;
import com.binarystack.coaching.entity.User;
import com.binarystack.coaching.enums.Role;
import com.binarystack.coaching.exception.BadRequestException;
import com.binarystack.coaching.exception.ResourceNotFoundException;
import com.binarystack.coaching.repository.CourseRepository;
import com.binarystack.coaching.repository.EnrollmentRepository;
import com.binarystack.coaching.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;

@Service
public class RazorpayPaymentService {

    private static final Logger log = LoggerFactory.getLogger(RazorpayPaymentService.class);
    private static final String RAZORPAY_BASE_URL = "https://api.razorpay.com/v1";

    private final RestClient restClient;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final EnrollmentService enrollmentService;

    private final String keyId;
    private final String keySecret;
    private final String currency;
    private final String basicAuthHeader;

    public RazorpayPaymentService(UserRepository userRepository,
                                  CourseRepository courseRepository,
                                  EnrollmentRepository enrollmentRepository,
                                  EnrollmentService enrollmentService,
                                  @Value("${app.razorpay.key-id}") String keyId,
                                  @Value("${app.razorpay.key-secret}") String keySecret,
                                  @Value("${app.razorpay.currency:INR}") String currency) {
        String normalizedKeyId = normalizeCredential(keyId);
        String normalizedKeySecret = normalizeCredential(keySecret);

        if (normalizedKeyId.isBlank() || normalizedKeySecret.isBlank()) {
            throw new IllegalStateException("Razorpay keys are not configured. Set APP_RAZORPAY_KEY_ID and APP_RAZORPAY_KEY_SECRET.");
        }

        this.restClient = RestClient.builder().baseUrl(RAZORPAY_BASE_URL).build();
        this.userRepository = userRepository;
        this.courseRepository = courseRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.enrollmentService = enrollmentService;
        this.keyId = normalizedKeyId;
        this.keySecret = normalizedKeySecret;
        this.currency = currency.toUpperCase(Locale.ROOT);
        this.basicAuthHeader = buildBasicAuthHeader(this.keyId, this.keySecret);
    }

    public RazorpayOrderResponse createOrder(RazorpayOrderRequest request) {
        User student = getStudent(request.getStudentId());
        Course course = getCourse(request.getCourseId());

        if (enrollmentRepository.existsByStudentAndCourse(student, course)) {
            throw new BadRequestException("Student is already enrolled in this course");
        }

        BigDecimal coursePrice = getCoursePrice(course);
        if (coursePrice.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("This is a free course. No payment is required.");
        }

        long amountInPaise = toPaise(coursePrice);
        String receipt = buildReceipt(request.getStudentId(), request.getCourseId());

        JsonNode orderResponse;
        try {
            orderResponse = restClient.post()
                    .uri("/orders")
                    .header(HttpHeaders.AUTHORIZATION, basicAuthHeader)
                    .body(Map.of(
                            "amount", amountInPaise,
                            "currency", currency,
                            "receipt", receipt,
                            "payment_capture", 1
                    ))
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientResponseException ex) {
            int status = ex.getStatusCode().value();
            String responseBody = ex.getResponseBodyAsString();
            if (status == 401) {
                log.error("Razorpay order creation failed: HTTP 401, keyIdPrefix={}..., response={}", maskKeyId(keyId), responseBody);
                throw new BadRequestException("Razorpay authentication failed (HTTP 401). Verify APP_RAZORPAY_KEY_ID and APP_RAZORPAY_KEY_SECRET.");
            }
            log.error("Razorpay order creation failed: HTTP {}, response={}", status, responseBody);
            throw new BadRequestException("Unable to create Razorpay order. Please try again.");
        }

        if (orderResponse == null || orderResponse.path("id").asText().isBlank()) {
            throw new BadRequestException("Unable to create Razorpay order. Please try again.");
        }

        String razorpayOrderId = orderResponse.path("id").asText();
        log.info("Razorpay order created: orderId={}, studentId={}, courseId={}",
                razorpayOrderId, request.getStudentId(), request.getCourseId());

        return new RazorpayOrderResponse(
                keyId,
                razorpayOrderId,
                amountInPaise,
                currency,
                request.getStudentId(),
                request.getCourseId(),
                course.getTitle(),
                student.getName(),
                student.getEmail(),
                student.getPhoneNumber()
        );
    }

    public EnrollmentDto verifyPaymentAndEnroll(RazorpayVerifyRequest request) {
        User student = getStudent(request.getStudentId());
        Course course = getCourse(request.getCourseId());

        if (enrollmentRepository.existsByStudentAndCourse(student, course)) {
            throw new BadRequestException("Student is already enrolled in this course");
        }

        BigDecimal coursePrice = getCoursePrice(course);
        if (coursePrice.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("This is a free course. No payment is required.");
        }

        JsonNode orderDetails = fetchOrderDetails(request.getRazorpayOrderId());
        validateOrderDetails(orderDetails, request.getStudentId(), request.getCourseId(), toPaise(coursePrice));

        String expectedSignature = generateSignature(request.getRazorpayOrderId(), request.getRazorpayPaymentId());
        if (!signaturesMatch(expectedSignature, request.getRazorpaySignature())) {
            throw new BadRequestException("Payment verification failed.");
        }

        log.info("Razorpay payment verified: orderId={}, paymentId={}, studentId={}, courseId={}",
                request.getRazorpayOrderId(), request.getRazorpayPaymentId(), request.getStudentId(), request.getCourseId());

        return enrollmentService.enroll(request.getStudentId(), request.getCourseId());
    }

    private JsonNode fetchOrderDetails(String razorpayOrderId) {
        try {
            return restClient.get()
                    .uri("/orders/{orderId}", razorpayOrderId)
                    .header(HttpHeaders.AUTHORIZATION, basicAuthHeader)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientResponseException ex) {
            int status = ex.getStatusCode().value();
            String responseBody = ex.getResponseBodyAsString();
            if (status == 401) {
                log.error("Razorpay order verification failed: HTTP 401, keyIdPrefix={}..., orderId={}, response={}",
                        maskKeyId(keyId), razorpayOrderId, responseBody);
                throw new BadRequestException("Razorpay authentication failed (HTTP 401). Verify APP_RAZORPAY_KEY_ID and APP_RAZORPAY_KEY_SECRET.");
            }
            log.error("Razorpay order verification failed for {}: HTTP {}, response={}", razorpayOrderId, status, responseBody);
            throw new BadRequestException("Unable to verify payment order. Please retry payment.");
        }
    }

    private void validateOrderDetails(JsonNode order,
                                      Long studentId,
                                      Long courseId,
                                      long expectedAmountInPaise) {
        if (order == null) {
            throw new BadRequestException("Payment order details are unavailable.");
        }

        long orderAmount = order.path("amount").asLong(-1);
        String orderCurrency = order.path("currency").asText("");
        String receipt = order.path("receipt").asText("");
        String expectedReceiptPrefix = "enroll_" + studentId + "_" + courseId + "_";

        if (orderAmount != expectedAmountInPaise || !currency.equalsIgnoreCase(orderCurrency) || !receipt.startsWith(expectedReceiptPrefix)) {
            throw new BadRequestException("Payment details do not match selected course.");
        }
    }

    private String generateSignature(String orderId, String paymentId) {
        try {
            String payload = orderId + "|" + paymentId;
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(keySecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] digest = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            return toHex(digest);
        } catch (Exception ex) {
            throw new BadRequestException("Failed to validate payment signature.");
        }
    }

    private boolean signaturesMatch(String expected, String actual) {
        return MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8),
                actual.getBytes(StandardCharsets.UTF_8)
        );
    }

    private long toPaise(BigDecimal amount) {
        return amount.multiply(BigDecimal.valueOf(100))
                .setScale(0, RoundingMode.HALF_UP)
                .longValue();
    }

    private BigDecimal getCoursePrice(Course course) {
        return course.getPrice() == null ? BigDecimal.ZERO : course.getPrice();
    }

    private User getStudent(Long studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + studentId));
        if (student.getRole() != Role.STUDENT) {
            throw new BadRequestException("Payment is supported only for student enrollments.");
        }
        return student;
    }

    private Course getCourse(Long courseId) {
        return courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found: " + courseId));
    }

    private String buildReceipt(Long studentId, Long courseId) {
        return "enroll_" + studentId + "_" + courseId + "_" + System.currentTimeMillis();
    }

    private String buildBasicAuthHeader(String id, String secret) {
        String credentials = id + ":" + secret;
        String encoded = Base64.getEncoder().encodeToString(credentials.getBytes(StandardCharsets.UTF_8));
        return "Basic " + encoded;
    }

    private String normalizeCredential(String value) {
        if (value == null) {
            return "";
        }

        String normalized = value.trim();
        if ((normalized.startsWith("\"") && normalized.endsWith("\""))
                || (normalized.startsWith("'") && normalized.endsWith("'"))) {
            normalized = normalized.substring(1, normalized.length() - 1).trim();
        }
        return normalized;
    }

    private String maskKeyId(String id) {
        if (id == null || id.isBlank()) {
            return "unknown";
        }
        return id.substring(0, Math.min(10, id.length()));
    }

    private String toHex(byte[] bytes) {
        StringBuilder hex = new StringBuilder(bytes.length * 2);
        for (byte value : bytes) {
            String part = Integer.toHexString(value & 0xff);
            if (part.length() == 1) {
                hex.append('0');
            }
            hex.append(part);
        }
        return hex.toString();
    }

    public RazorpayCartOrderResponse createCartOrder(Long studentId, List<Course> courses, BigDecimal totalPrice) {
        User student = getStudent(studentId);
        
        long amountInPaise = toPaise(totalPrice);
        String receipt = "cart_checkout_" + studentId + "_" + System.currentTimeMillis();

        JsonNode orderResponse;
        try {
            orderResponse = restClient.post()
                    .uri("/orders")
                    .header(HttpHeaders.AUTHORIZATION, basicAuthHeader)
                    .body(Map.of(
                            "amount", amountInPaise,
                            "currency", currency,
                            "receipt", receipt,
                            "payment_capture", 1
                    ))
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientResponseException ex) {
            int status = ex.getStatusCode().value();
            String responseBody = ex.getResponseBodyAsString();
            if (status == 401) {
                log.error("Razorpay cart order creation failed: HTTP 401, keyIdPrefix={}..., response={}", maskKeyId(keyId), responseBody);
                throw new BadRequestException("Razorpay authentication failed (HTTP 401). Verify APP_RAZORPAY_KEY_ID and APP_RAZORPAY_KEY_SECRET.");
            }
            log.error("Razorpay cart order creation failed: HTTP {}, response={}", status, responseBody);
            throw new BadRequestException("Unable to create Razorpay order. Please try again.");
        }

        if (orderResponse == null || orderResponse.path("id").asText().isBlank()) {
            throw new BadRequestException("Unable to create Razorpay order. Please try again.");
        }

        String razorpayOrderId = orderResponse.path("id").asText();
        log.info("Razorpay cart order created: orderId={}, studentId={}, amount={}",
                razorpayOrderId, studentId, amountInPaise);

        List<Long> courseIds = courses.stream().map(Course::getId).toList();
        String coursesTitle = "Enrollment in " + courses.size() + " Course(s)";

        return new RazorpayCartOrderResponse(
                keyId,
                razorpayOrderId,
                amountInPaise,
                currency,
                studentId,
                courseIds,
                coursesTitle,
                student.getName(),
                student.getEmail(),
                student.getPhoneNumber()
        );
    }

    public void verifyCartPayment(RazorpayCartVerifyRequest request, BigDecimal totalPrice) {
        User student = getStudent(request.getStudentId());

        JsonNode orderDetails = fetchOrderDetails(request.getRazorpayOrderId());
        
        long expectedAmountInPaise = toPaise(totalPrice);
        
        if (orderDetails == null) {
            throw new BadRequestException("Payment order details are unavailable.");
        }

        long orderAmount = orderDetails.path("amount").asLong(-1);
        String orderCurrency = orderDetails.path("currency").asText("");
        String receipt = orderDetails.path("receipt").asText("");
        String expectedReceiptPrefix = "cart_checkout_" + request.getStudentId() + "_";

        if (orderAmount != expectedAmountInPaise || !currency.equalsIgnoreCase(orderCurrency) || !receipt.startsWith(expectedReceiptPrefix)) {
            throw new BadRequestException("Payment details do not match selected courses.");
        }

        String expectedSignature = generateSignature(request.getRazorpayOrderId(), request.getRazorpayPaymentId());
        if (!signaturesMatch(expectedSignature, request.getRazorpaySignature())) {
            throw new BadRequestException("Payment verification failed.");
        }

        log.info("Razorpay cart payment verified: orderId={}, paymentId={}, studentId={}",
                request.getRazorpayOrderId(), request.getRazorpayPaymentId(), request.getStudentId());
    }
}
