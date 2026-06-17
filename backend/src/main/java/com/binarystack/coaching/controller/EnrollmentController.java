package com.binarystack.coaching.controller;

import com.binarystack.coaching.dto.EnrollmentDto;
import com.binarystack.coaching.service.EnrollmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/enrollments")
@Tag(name = "Enrollments", description = "Course enrollment endpoints")
@SecurityRequirement(name = "bearerAuth")
public class EnrollmentController {

    private final EnrollmentService enrollmentService;

    public EnrollmentController(EnrollmentService enrollmentService) {
        this.enrollmentService = enrollmentService;
    }

    /**
     * Enroll currently authenticated student in a course.
     * POST /api/enrollments?studentId=X&courseId=Y
     */
    @PostMapping
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Enroll a student in a course")
    public ResponseEntity<EnrollmentDto> enroll(@RequestParam Long studentId,
                                                 @RequestParam Long courseId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(enrollmentService.enroll(studentId, courseId));
    }

    /**
     * Get enrollments for a specific student.
     * GET /api/enrollments/student/{studentId}
     */
    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN')")
    @Operation(summary = "Get enrollments for a student")
    public ResponseEntity<List<EnrollmentDto>> getStudentEnrollments(@PathVariable Long studentId) {
        return ResponseEntity.ok(enrollmentService.getEnrollmentsForStudent(studentId));
    }

    /**
     * Admin: get all enrollments.
     * GET /api/enrollments/all
     */
    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all enrollments (Admin only)")
    public ResponseEntity<List<EnrollmentDto>> getAllEnrollments() {
        return ResponseEntity.ok(enrollmentService.getAllEnrollments());
    }
}
