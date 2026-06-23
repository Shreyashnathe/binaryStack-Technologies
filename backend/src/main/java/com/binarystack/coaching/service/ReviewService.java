package com.binarystack.coaching.service;

import com.binarystack.coaching.dto.CreateReviewRequest;
import com.binarystack.coaching.dto.ReviewDto;
import com.binarystack.coaching.entity.Course;
import com.binarystack.coaching.entity.Review;
import com.binarystack.coaching.entity.User;
import com.binarystack.coaching.exception.BadRequestException;
import com.binarystack.coaching.exception.ResourceNotFoundException;
import com.binarystack.coaching.repository.CourseRepository;
import com.binarystack.coaching.repository.EnrollmentRepository;
import com.binarystack.coaching.repository.ReviewRepository;
import com.binarystack.coaching.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class ReviewService {

    private static final Logger log = LoggerFactory.getLogger(ReviewService.class);

    private final ReviewRepository reviewRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final EnrollmentRepository enrollmentRepository;

    public ReviewService(ReviewRepository reviewRepository,
                         CourseRepository courseRepository,
                         UserRepository userRepository,
                         EnrollmentRepository enrollmentRepository) {
        this.reviewRepository = reviewRepository;
        this.courseRepository = courseRepository;
        this.userRepository = userRepository;
        this.enrollmentRepository = enrollmentRepository;
    }

    public List<ReviewDto> getReviewsByCourse(Long courseId) {
        Objects.requireNonNull(courseId, "Course id must not be null");
        if (!courseRepository.existsById(courseId)) {
            throw new ResourceNotFoundException("Course not found with id: " + courseId);
        }
        return reviewRepository.findByCourseId(courseId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public ReviewDto addReview(Long courseId, String studentEmail, CreateReviewRequest request) {
        Objects.requireNonNull(courseId, "Course id must not be null");
        Objects.requireNonNull(studentEmail, "Student email must not be null");

        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + studentEmail));

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + courseId));

        // 1. Verify student is enrolled in the course
        boolean isEnrolled = enrollmentRepository.existsByStudentAndCourse(student, course);
        if (!isEnrolled) {
            throw new BadRequestException("You must be enrolled in the course to write a review.");
        }

        // 2. Verify student hasn't reviewed the course already
        boolean alreadyReviewed = reviewRepository.existsByStudentAndCourse(student, course);
        if (alreadyReviewed) {
            throw new BadRequestException("You have already submitted a review for this course.");
        }

        Review review = new Review();
        review.setStudent(student);
        review.setCourse(course);
        review.setRating(request.getRating());
        review.setComment(request.getComment());

        Review saved = reviewRepository.save(review);
        log.info("Review added for course '{}' by student '{}'", course.getTitle(), student.getEmail());

        return toDto(saved);
    }

    @Transactional
    public void deleteReview(Long reviewId, String currentUsername, boolean isAdmin) {
        Objects.requireNonNull(reviewId, "Review id must not be null");

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with id: " + reviewId));

        // Verify that the current user is either the author or an ADMIN
        if (!isAdmin && !review.getStudent().getEmail().equalsIgnoreCase(currentUsername)) {
            throw new BadRequestException("You are not authorized to delete this review.");
        }

        reviewRepository.delete(review);
        log.info("Review deleted: id={}, byUser={}", reviewId, currentUsername);
    }

    public ReviewDto toDto(Review review) {
        return new ReviewDto(
                review.getId(),
                review.getStudent().getId(),
                review.getStudent().getName(),
                review.getCourse().getId(),
                review.getCourse().getTitle(),
                review.getRating(),
                review.getComment(),
                review.getCreatedAt()
        );
    }
}
