package com.binarystack.coaching.controller;

import com.binarystack.coaching.dto.*;
import com.binarystack.coaching.service.CartService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/cart")
@Tag(name = "Cart", description = "Shopping cart endpoints for student enrollments")
@SecurityRequirement(name = "bearerAuth")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @PostMapping("/add")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Add a paid course to the student's cart")
    public ResponseEntity<ApiResponse<CourseDto>> addToCart(@RequestParam Long studentId,
                                                           @RequestParam Long courseId) {
        CourseDto course = cartService.addToCart(studentId, courseId);
        ApiResponse<CourseDto> response = new ApiResponse<>(true, "Course added to cart successfully", course);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Get all items in the student's cart")
    public ResponseEntity<ApiResponse<List<CourseDto>>> getCart(@RequestParam Long studentId) {
        List<CourseDto> cart = cartService.getCart(studentId);
        ApiResponse<List<CourseDto>> response = new ApiResponse<>(true, "Cart retrieved successfully", cart);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/remove")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Remove a course from the student's cart")
    public ResponseEntity<ApiResponse<Void>> removeFromCart(@RequestParam Long studentId,
                                                             @RequestParam Long courseId) {
        cartService.removeFromCart(studentId, courseId);
        ApiResponse<Void> response = new ApiResponse<>(true, "Course removed from cart successfully", null);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/checkout")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Checkout cart and generate combined Razorpay order")
    public ResponseEntity<ApiResponse<RazorpayCartOrderResponse>> checkout(@RequestParam Long studentId) {
        RazorpayCartOrderResponse order = cartService.checkoutCart(studentId);
        ApiResponse<RazorpayCartOrderResponse> response = new ApiResponse<>(true, "Razorpay order created for cart checkout", order);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Verify combined Razorpay payment, enroll student, and clear cart")
    public ResponseEntity<ApiResponse<List<EnrollmentDto>>> verify(@Valid @RequestBody RazorpayCartVerifyRequest request) {
        List<EnrollmentDto> enrollments = cartService.verifyCartPaymentAndEnroll(request);
        ApiResponse<List<EnrollmentDto>> response = new ApiResponse<>(true, "Payment verified and enrollments completed successfully", enrollments);
        return ResponseEntity.ok(response);
    }
}
