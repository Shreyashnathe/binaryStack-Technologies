package com.binarystack.coaching.service;

import com.binarystack.coaching.dto.*;
import com.binarystack.coaching.entity.CartItem;
import com.binarystack.coaching.entity.Course;
import com.binarystack.coaching.entity.User;
import com.binarystack.coaching.enums.Role;
import com.binarystack.coaching.exception.BadRequestException;
import com.binarystack.coaching.exception.ResourceNotFoundException;
import com.binarystack.coaching.repository.CartItemRepository;
import com.binarystack.coaching.repository.CourseRepository;
import com.binarystack.coaching.repository.EnrollmentRepository;
import com.binarystack.coaching.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CartService {

    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final EnrollmentService enrollmentService;
    private final RazorpayPaymentService razorpayPaymentService;

    public CartService(CartItemRepository cartItemRepository,
                       UserRepository userRepository,
                       CourseRepository courseRepository,
                       EnrollmentRepository enrollmentRepository,
                       EnrollmentService enrollmentService,
                       RazorpayPaymentService razorpayPaymentService) {
        this.cartItemRepository = cartItemRepository;
        this.userRepository = userRepository;
        this.courseRepository = courseRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.enrollmentService = enrollmentService;
        this.razorpayPaymentService = razorpayPaymentService;
    }

    private User getStudent(Long studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + studentId));
        if (student.getRole() != Role.STUDENT) {
            throw new BadRequestException("Only students can manage a shopping cart.");
        }
        return student;
    }

    private Course getCourse(Long courseId) {
        return courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found: " + courseId));
    }

    @Transactional
    public CourseDto addToCart(Long studentId, Long courseId) {
        User student = getStudent(studentId);
        Course course = getCourse(courseId);

        // Block add if already enrolled
        if (enrollmentRepository.existsByStudentAndCourse(student, course)) {
            throw new BadRequestException("You are already enrolled in this course.");
        }

        // Block add if already in cart
        if (cartItemRepository.existsByStudentAndCourse(student, course)) {
            throw new BadRequestException("This course is already in your cart.");
        }

        // Free courses skip cart
        BigDecimal price = course.getPrice() == null ? BigDecimal.ZERO : course.getPrice();
        if (price.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("This is a free course. You can enroll in it directly.");
        }

        CartItem cartItem = new CartItem(student, course);
        cartItemRepository.save(cartItem);

        return new CourseDto(
                course.getId(),
                course.getTitle(),
                course.getDescription(),
                course.getPrice(),
                course.getDurationDays(),
                course.getTotalHours(),
                course.getCreatedAt(),
                course.getUpdatedAt()
        );
    }

    public List<CourseDto> getCart(Long studentId) {
        getStudent(studentId); // Verify student exists
        List<CartItem> items = cartItemRepository.findByStudentId(studentId);
        return items.stream()
                .map(item -> new CourseDto(
                        item.getCourse().getId(),
                        item.getCourse().getTitle(),
                        item.getCourse().getDescription(),
                        item.getCourse().getPrice(),
                        item.getCourse().getDurationDays(),
                        item.getCourse().getTotalHours(),
                        item.getCourse().getCreatedAt(),
                        item.getCourse().getUpdatedAt()
                ))
                .collect(Collectors.toList());
    }

    @Transactional
    public void removeFromCart(Long studentId, Long courseId) {
        User student = getStudent(studentId);
        Course course = getCourse(courseId);

        CartItem cartItem = cartItemRepository.findByStudentAndCourse(student, course)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found in your cart."));
        cartItemRepository.delete(cartItem);
    }

    private BigDecimal applyDiscount(BigDecimal amount, String coupon) {
        if (coupon == null || coupon.trim().isEmpty()) {
            return amount;
        }
        String cleanCoupon = coupon.trim().toUpperCase();
        if ("SAVE10".equals(cleanCoupon)) {
            return amount.multiply(new BigDecimal("0.90")).setScale(2, java.math.RoundingMode.HALF_UP);
        } else if ("BINARYSTACK20".equals(cleanCoupon)) {
            return amount.multiply(new BigDecimal("0.80")).setScale(2, java.math.RoundingMode.HALF_UP);
        } else if ("WELCOME50".equals(cleanCoupon)) {
            return amount.multiply(new BigDecimal("0.50")).setScale(2, java.math.RoundingMode.HALF_UP);
        }
        throw new BadRequestException("Invalid coupon code");
    }

    @Transactional
    public RazorpayCartOrderResponse checkoutCart(Long studentId, String coupon) {
        User student = getStudent(studentId);
        List<CartItem> cartItems = cartItemRepository.findByStudentId(studentId);
        if (cartItems.isEmpty()) {
            throw new BadRequestException("Your cart is empty.");
        }

        List<Course> courses = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (CartItem item : cartItems) {
            Course course = item.getCourse();
            if (enrollmentRepository.existsByStudentAndCourse(student, course)) {
                throw new BadRequestException("You are already enrolled in course: " + course.getTitle());
            }
            courses.add(course);
            totalAmount = totalAmount.add(course.getPrice() == null ? BigDecimal.ZERO : course.getPrice());
        }

        BigDecimal discountedAmount = applyDiscount(totalAmount, coupon);
        return razorpayPaymentService.createCartOrder(studentId, courses, discountedAmount);
    }

    @Transactional
    public List<EnrollmentDto> verifyCartPaymentAndEnroll(RazorpayCartVerifyRequest request) {
        User student = getStudent(request.getStudentId());
        List<CartItem> cartItems = cartItemRepository.findByStudentId(request.getStudentId());
        if (cartItems.isEmpty()) {
            throw new BadRequestException("Your cart is empty. Nothing to verify.");
        }

        List<Course> courses = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (CartItem item : cartItems) {
            Course course = item.getCourse();
            if (enrollmentRepository.existsByStudentAndCourse(student, course)) {
                throw new BadRequestException("You are already enrolled in course: " + course.getTitle());
            }
            courses.add(course);
            totalAmount = totalAmount.add(course.getPrice() == null ? BigDecimal.ZERO : course.getPrice());
        }

        BigDecimal discountedAmount = applyDiscount(totalAmount, request.getCoupon());

        // Verify the payment
        razorpayPaymentService.verifyCartPayment(request, discountedAmount);

        // Perform bulk enrollment
        List<EnrollmentDto> enrollments = new ArrayList<>();
        for (Course course : courses) {
            enrollments.add(enrollmentService.enroll(student.getId(), course.getId()));
        }

        // Clear the cart
        cartItemRepository.deleteAll(cartItems);

        return enrollments;
    }
}
