package com.binarystack.coaching.service;

import com.binarystack.coaching.dto.CourseDto;
import com.binarystack.coaching.entity.Course;
import com.binarystack.coaching.exception.ResourceNotFoundException;
import com.binarystack.coaching.repository.CourseRepository;
import com.binarystack.coaching.repository.EnrollmentRepository;
import com.binarystack.coaching.repository.ReviewRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class CourseService {

    private static final Logger log = LoggerFactory.getLogger(CourseService.class);

    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final ReviewRepository reviewRepository;

    public CourseService(CourseRepository courseRepository,
                         EnrollmentRepository enrollmentRepository,
                         ReviewRepository reviewRepository) {
        this.courseRepository = courseRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.reviewRepository = reviewRepository;
    }

    @Cacheable(value = "courses", key = "'all'")
    public List<CourseDto> getAllCourses() {
        return courseRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Cacheable(value = "course", key = "#id")
    public CourseDto getCourseById(Long id) {
        Objects.requireNonNull(id, "Course id must not be null");
        return toDto(findCourseOrThrow(id));
    }

    @Transactional
    @CacheEvict(value = "courses", allEntries = true)
    public CourseDto createCourse(CourseDto dto) {
        Course course = new Course();
        course.setTitle(dto.getTitle());
        course.setDescription(dto.getDescription());
        course.setPrice(dto.getPrice());
        course.setDurationDays(dto.getDurationDays());
        course.setTotalHours(dto.getTotalHours());
        Course saved = courseRepository.save(course);
        log.info("Course created: {}", saved.getTitle());
        return toDto(saved);
    }

    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "courses", allEntries = true),
        @CacheEvict(value = "course", key = "#id")
    })
    public CourseDto updateCourse(Long id, CourseDto dto) {
        Objects.requireNonNull(id, "Course id must not be null");
        Course course = findCourseOrThrow(id);
        course.setTitle(dto.getTitle());
        course.setDescription(dto.getDescription());
        course.setPrice(dto.getPrice());
        course.setDurationDays(dto.getDurationDays());
        course.setTotalHours(dto.getTotalHours());
        Course updated = courseRepository.save(course);
        log.info("Course updated: id={}", id);
        return toDto(updated);
    }

    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "courses", allEntries = true),
        @CacheEvict(value = "course", key = "#id")
    })
    public void deleteCourse(Long id) {
        Objects.requireNonNull(id, "Course id must not be null");
        Course course = findCourseOrThrow(id);
        long removedEnrollments = enrollmentRepository.deleteByCourse(course);
        courseRepository.deleteById(id);
        log.info("Course deleted: id={}, removedEnrollments={}", id, removedEnrollments);
    }

    // ---- Helpers ----

    private Course findCourseOrThrow(Long id) {
        Objects.requireNonNull(id, "Course id must not be null");
        return courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + id));
    }

    public CourseDto toDto(Course course) {
        CourseDto dto = new CourseDto(
            course.getId(),
            course.getTitle(),
            course.getDescription(),
            course.getPrice(),
            course.getDurationDays(),
            course.getTotalHours(),
            course.getCreatedAt(),
            course.getUpdatedAt()
        );
        if (course.getId() != null) {
            dto.setAverageRating(reviewRepository.getAverageRatingByCourseId(course.getId()));
            dto.setReviewCount(reviewRepository.countByCourseId(course.getId()));
        } else {
            dto.setAverageRating(0.0);
            dto.setReviewCount(0L);
        }
        return dto;
    }
}
