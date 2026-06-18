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

import org.springframework.security.core.Authentication;
import jakarta.servlet.http.HttpServletResponse;
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

    /**
     * Admin: export all enrollments to Excel or CSV.
     * GET /api/enrollments/export
     */
    @GetMapping("/export")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Export all enrollments as CSV or Excel (Admin only)")
    public ResponseEntity<byte[]> exportEnrollments(@RequestParam(defaultValue = "excel") String format) {
        if ("csv".equalsIgnoreCase(format)) {
            byte[] csvBytes = enrollmentService.exportEnrollmentsToCsv();
            return ResponseEntity.ok()
                    .header("Content-Disposition", "attachment; filename=\"enrollments.csv\"")
                    .header("Content-Type", "text/csv")
                    .body(csvBytes);
        } else {
            byte[] excelBytes = enrollmentService.exportEnrollmentsToExcel();
            return ResponseEntity.ok()
                    .header("Content-Disposition", "attachment; filename=\"enrollments.xlsx\"")
                    .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                    .body(excelBytes);
        }
    }

    /**
     * Get /api/enrollments/{id}/receipt
     * Download receipt PDF for an enrollment (owner or ADMIN only).
     */
    @GetMapping("/{id}/receipt")
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN')")
    @Operation(summary = "Download receipt for a course enrollment")
    public void downloadReceipt(@PathVariable Long id,
                                Authentication authentication,
                                HttpServletResponse response) throws java.io.IOException {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        String username = authentication.getName();

        response.setContentType("application/pdf");
        response.setHeader("Content-Disposition", "attachment; filename=\"BinaryStack_Receipt_" + id + ".pdf\"");

        enrollmentService.generateReceiptPdf(id, username, isAdmin, response.getOutputStream());
    }
}
