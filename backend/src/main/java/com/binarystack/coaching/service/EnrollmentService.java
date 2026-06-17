package com.binarystack.coaching.service;

import com.binarystack.coaching.dto.EnrollmentDto;
import com.binarystack.coaching.entity.Course;
import com.binarystack.coaching.entity.Enrollment;
import com.binarystack.coaching.entity.User;
import com.binarystack.coaching.exception.BadRequestException;
import com.binarystack.coaching.exception.ResourceNotFoundException;
import com.binarystack.coaching.repository.CourseRepository;
import com.binarystack.coaching.repository.EnrollmentRepository;
import com.binarystack.coaching.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class EnrollmentService {

        private static final Logger log = LoggerFactory.getLogger(EnrollmentService.class);

    private final EnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;

        public EnrollmentService(EnrollmentRepository enrollmentRepository,
                                                         UserRepository userRepository,
                                                         CourseRepository courseRepository) {
                this.enrollmentRepository = enrollmentRepository;
                this.userRepository = userRepository;
                this.courseRepository = courseRepository;
        }

    /**
     * Enroll a student in a course.
     */
    @Transactional
    public EnrollmentDto enroll(Long studentId, Long courseId) {
        Objects.requireNonNull(studentId, "Student id must not be null");
        Objects.requireNonNull(courseId, "Course id must not be null");

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + studentId));
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found: " + courseId));

        if (enrollmentRepository.existsByStudentAndCourse(student, course)) {
            throw new BadRequestException("Student is already enrolled in this course");
        }

        Enrollment enrollment = new Enrollment();
        enrollment.setStudent(student);
        enrollment.setCourse(course);

        Enrollment saved = enrollmentRepository.save(enrollment);
        log.info("Student {} enrolled in course {}", studentId, courseId);
        return toDto(saved);
    }

    /**
     * Get all enrollments for a specific student.
     */
    public List<EnrollmentDto> getEnrollmentsForStudent(Long studentId) {
        Objects.requireNonNull(studentId, "Student id must not be null");

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + studentId));
        return enrollmentRepository.findByStudent(student)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Get all enrollments (admin view).
     */
    public List<EnrollmentDto> getAllEnrollments() {
        return enrollmentRepository.findAll()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    // ---- Helpers ----

    private EnrollmentDto toDto(Enrollment e) {
        return new EnrollmentDto(
                e.getId(),
                e.getStudent().getId(),
                e.getStudent().getName(),
                e.getStudent().getEmail(),
                e.getCourse().getId(),
                e.getCourse().getTitle(),
                e.getEnrolledAt()
        );
    }
}
