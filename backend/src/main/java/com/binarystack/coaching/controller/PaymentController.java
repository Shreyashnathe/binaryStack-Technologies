package com.binarystack.coaching.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.binarystack.coaching.dto.EnrollmentDto;
import com.binarystack.coaching.dto.RazorpayOrderRequest;
import com.binarystack.coaching.dto.RazorpayOrderResponse;
import com.binarystack.coaching.dto.RazorpayVerifyRequest;
import com.binarystack.coaching.service.RazorpayPaymentService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/payments/razorpay")
@Tag(name = "Payments", description = "Razorpay payment endpoints for demo enrollments")
@SecurityRequirement(name = "bearerAuth")
public class PaymentController {

    private final RazorpayPaymentService razorpayPaymentService;

    public PaymentController(RazorpayPaymentService razorpayPaymentService) {
        this.razorpayPaymentService = razorpayPaymentService;
    }

    @PostMapping("/order")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Create Razorpay order for course enrollment")
    public ResponseEntity<RazorpayOrderResponse> createOrder(@Valid @RequestBody RazorpayOrderRequest request) {
        return ResponseEntity.ok(razorpayPaymentService.createOrder(request));
    }

    @PostMapping("/verify")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Verify Razorpay payment and complete enrollment")
    public ResponseEntity<EnrollmentDto> verifyAndEnroll(@Valid @RequestBody RazorpayVerifyRequest request) {
        return ResponseEntity.ok(razorpayPaymentService.verifyPaymentAndEnroll(request));
    }
}
