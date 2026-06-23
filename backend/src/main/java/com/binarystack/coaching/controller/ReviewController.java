package com.binarystack.coaching.controller;

import com.binarystack.coaching.dto.CreateReviewRequest;
import com.binarystack.coaching.dto.ReviewDto;
import com.binarystack.coaching.service.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@Tag(name = "Reviews", description = "Course review and rating endpoints")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping("/courses/{courseId}/reviews")
    @PreAuthorize("hasRole('STUDENT')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Add a new course review (Student only)")
    public ResponseEntity<ReviewDto> addReview(@PathVariable Long courseId,
                                                @Valid @RequestBody CreateReviewRequest request,
                                                Authentication authentication) {
        ReviewDto review = reviewService.addReview(courseId, authentication.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(review);
    }

    @GetMapping("/courses/{courseId}/reviews")
    @Operation(summary = "Get all reviews for a course (public)")
    public ResponseEntity<List<ReviewDto>> getReviewsForCourse(@PathVariable Long courseId) {
        List<ReviewDto> reviews = reviewService.getReviewsByCourse(courseId);
        return ResponseEntity.ok(reviews);
    }

    @DeleteMapping("/reviews/{id}")
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Delete a review")
    public ResponseEntity<Void> deleteReview(@PathVariable Long id,
                                             Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        reviewService.deleteReview(id, authentication.getName(), isAdmin);
        return ResponseEntity.noContent().build();
    }
}
