package com.binarystack.coaching.service;

import com.binarystack.coaching.dto.EnrollmentDto;
import com.binarystack.coaching.entity.Course;
import com.binarystack.coaching.entity.Enrollment;
import com.binarystack.coaching.entity.User;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfWriter;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.Element;
import java.awt.Color;
import com.binarystack.coaching.exception.BadRequestException;
import com.binarystack.coaching.exception.ResourceNotFoundException;
import com.binarystack.coaching.repository.CourseRepository;
import com.binarystack.coaching.repository.EnrollmentRepository;
import com.binarystack.coaching.repository.UserRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
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
                e.getEnrolledAt(),
                e.getExpiryDate()
        );
    }

    /**
     * Export all enrollments to an Excel (.xlsx) file using Apache POI.
     */
    public byte[] exportEnrollmentsToExcel() {
        List<Enrollment> enrollments = enrollmentRepository.findAll();
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Enrollments");

            // Header Row
            Row headerRow = sheet.createRow(0);
            String[] columns = {"Enrollment ID", "Student ID", "Student Name", "Student Email", "Course ID", "Course Title", "Enrolled At", "Expiry Date"};

            CellStyle headerCellStyle = workbook.createCellStyle();
            org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerCellStyle.setFont(headerFont);

            for (int col = 0; col < columns.length; col++) {
                Cell cell = headerRow.createCell(col);
                cell.setCellValue(columns[col]);
                cell.setCellStyle(headerCellStyle);
            }

            // Data Rows
            int rowIdx = 1;
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
            for (Enrollment enrollment : enrollments) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(enrollment.getId());
                row.createCell(1).setCellValue(enrollment.getStudent().getId());
                row.createCell(2).setCellValue(enrollment.getStudent().getName());
                row.createCell(3).setCellValue(enrollment.getStudent().getEmail());
                row.createCell(4).setCellValue(enrollment.getCourse().getId());
                row.createCell(5).setCellValue(enrollment.getCourse().getTitle());

                String dateStr = "";
                if (enrollment.getEnrolledAt() != null) {
                    dateStr = enrollment.getEnrolledAt().format(formatter);
                }
                row.createCell(6).setCellValue(dateStr);

                String expiryStr = "";
                if (enrollment.getExpiryDate() != null) {
                    expiryStr = enrollment.getExpiryDate().format(formatter);
                } else {
                    expiryStr = "Lifetime Access";
                }
                row.createCell(7).setCellValue(expiryStr);
            }

            // Auto-size columns
            for (int col = 0; col < columns.length; col++) {
                sheet.autoSizeColumn(col);
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            log.error("Failed to generate Excel export", e);
            throw new RuntimeException("Failed to generate Excel export", e);
        }
    }

    /**
     * Export all enrollments to a standard CSV file.
     */
    public byte[] exportEnrollmentsToCsv() {
        List<Enrollment> enrollments = enrollmentRepository.findAll();
        StringBuilder sb = new StringBuilder();
        // Header
        sb.append("Enrollment ID,Student ID,Student Name,Student Email,Course ID,Course Title,Enrolled At,Expiry Date\n");

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        for (Enrollment enrollment : enrollments) {
            sb.append(enrollment.getId()).append(",");
            sb.append(enrollment.getStudent().getId()).append(",");
            sb.append(escapeCsvField(enrollment.getStudent().getName())).append(",");
            sb.append(escapeCsvField(enrollment.getStudent().getEmail())).append(",");
            sb.append(enrollment.getCourse().getId()).append(",");
            sb.append(escapeCsvField(enrollment.getCourse().getTitle())).append(",");

            String dateStr = "";
            if (enrollment.getEnrolledAt() != null) {
                dateStr = enrollment.getEnrolledAt().format(formatter);
            }
            sb.append(escapeCsvField(dateStr)).append(",");

            String expiryStr = "";
            if (enrollment.getExpiryDate() != null) {
                expiryStr = enrollment.getExpiryDate().format(formatter);
            } else {
                expiryStr = "Lifetime Access";
            }
            sb.append(escapeCsvField(expiryStr)).append("\n");
        }
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private String escapeCsvField(String field) {
        if (field == null) {
            return "";
        }
        if (field.contains(",") || field.contains("\"") || field.contains("\n") || field.contains("\r")) {
            return "\"" + field.replace("\"", "\"\"") + "\"";
        }
        return field;
    }

    @Transactional(readOnly = true)
    public void generateReceiptPdf(Long enrollmentId, String username, boolean isAdmin, java.io.OutputStream out) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment not found: " + enrollmentId));

        if (!isAdmin && !enrollment.getStudent().getEmail().equalsIgnoreCase(username)) {
            throw new org.springframework.security.access.AccessDeniedException("Access denied: You are not authorized to view this receipt");
        }

        Document document = new Document();
        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // Fonts
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22, new Color(42, 87, 191));
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, Color.DARK_GRAY);
            Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.BLACK);
            Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.BLACK);
            Font footerFont = FontFactory.getFont(FontFactory.HELVETICA, 8, Font.ITALIC, Color.GRAY);

            // Title Header
            Paragraph brand = new Paragraph("BinaryStack Technologies", titleFont);
            brand.setAlignment(Element.ALIGN_CENTER);
            brand.setSpacingAfter(5);
            document.add(brand);

            Paragraph subtitle = new Paragraph("INVOICE / RECEIPT", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, Color.GRAY));
            subtitle.setAlignment(Element.ALIGN_CENTER);
            subtitle.setSpacingAfter(25);
            document.add(subtitle);

            // Line Separator
            Paragraph divider = new Paragraph("----------------------------------------------------------------------------------------------------------------------------------");
            divider.setSpacingAfter(15);
            document.add(divider);

            // Invoice details table
            PdfPTable detailsTable = new PdfPTable(2);
            detailsTable.setWidthPercentage(100);
            detailsTable.setSpacingAfter(20);

            // Left: Invoice Metadata
            PdfPCell cell1 = new PdfPCell();
            cell1.setBorder(PdfPCell.NO_BORDER);
            cell1.addElement(new Paragraph("Receipt Number: BS-REC-" + enrollment.getId(), boldFont));
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MMM-yyyy HH:mm");
            String dateStr = enrollment.getEnrolledAt() != null ? enrollment.getEnrolledAt().format(formatter) : "";
            cell1.addElement(new Paragraph("Date: " + dateStr, normalFont));
            detailsTable.addCell(cell1);

            // Right: Billed To
            PdfPCell cell2 = new PdfPCell();
            cell2.setBorder(PdfPCell.NO_BORDER);
            cell2.setHorizontalAlignment(Element.ALIGN_RIGHT);
            Paragraph billTo = new Paragraph("Billed To:", boldFont);
            billTo.setAlignment(Element.ALIGN_RIGHT);
            Paragraph namePara = new Paragraph(enrollment.getStudent().getName(), normalFont);
            namePara.setAlignment(Element.ALIGN_RIGHT);
            Paragraph emailPara = new Paragraph(enrollment.getStudent().getEmail(), normalFont);
            emailPara.setAlignment(Element.ALIGN_RIGHT);
            
            cell2.addElement(billTo);
            cell2.addElement(namePara);
            cell2.addElement(emailPara);
            detailsTable.addCell(cell2);

            document.add(detailsTable);

            // Pricing Items Table
            PdfPTable itemsTable = new PdfPTable(2);
            itemsTable.setWidthPercentage(100);
            try {
                itemsTable.setWidths(new float[]{3.0f, 1.0f});
            } catch (DocumentException de) {
                // Ignore fallback
            }
            itemsTable.setSpacingAfter(30);

            // Headers
            PdfPCell h1 = new PdfPCell(new Paragraph("Course Description", headerFont));
            h1.setBackgroundColor(new Color(230, 235, 245));
            h1.setPadding(8);
            itemsTable.addCell(h1);

            PdfPCell h2 = new PdfPCell(new Paragraph("Price", headerFont));
            h2.setBackgroundColor(new Color(230, 235, 245));
            h2.setPadding(8);
            h2.setHorizontalAlignment(Element.ALIGN_RIGHT);
            itemsTable.addCell(h2);

            // Course item
            PdfPCell itemDesc = new PdfPCell(new Paragraph(enrollment.getCourse().getTitle(), normalFont));
            itemDesc.setPadding(8);
            itemsTable.addCell(itemDesc);

            java.math.BigDecimal price = enrollment.getCourse().getPrice() != null ? enrollment.getCourse().getPrice() : java.math.BigDecimal.ZERO;
            PdfPCell itemPrice = new PdfPCell(new Paragraph("INR " + price.toString(), normalFont));
            itemPrice.setPadding(8);
            itemPrice.setHorizontalAlignment(Element.ALIGN_RIGHT);
            itemsTable.addCell(itemPrice);

            // Total row
            PdfPCell totalLabelCell = new PdfPCell(new Paragraph("Total Paid", boldFont));
            totalLabelCell.setPadding(8);
            totalLabelCell.setBackgroundColor(new Color(245, 245, 245));
            itemsTable.addCell(totalLabelCell);

            PdfPCell totalValCell = new PdfPCell(new Paragraph("INR " + price.toString(), boldFont));
            totalValCell.setPadding(8);
            totalValCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            totalValCell.setBackgroundColor(new Color(245, 245, 245));
            itemsTable.addCell(totalValCell);

            document.add(itemsTable);

            // Paid Seal Stamp
            PdfPTable sealTable = new PdfPTable(1);
            sealTable.setWidthPercentage(100);
            sealTable.setSpacingAfter(40);
            PdfPCell sealCell = new PdfPCell();
            sealCell.setBorder(PdfPCell.NO_BORDER);
            sealCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            
            Paragraph seal = new Paragraph("PAYMENT STATUS: SECURELY PAID", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, new Color(16, 124, 65)));
            seal.setAlignment(Element.ALIGN_CENTER);
            sealCell.addElement(seal);
            sealTable.addCell(sealCell);
            document.add(sealTable);

            // Footer disclaimer
            Paragraph disclaimer = new Paragraph("This is an electronically generated invoice and does not require a physical signature.", footerFont);
            disclaimer.setAlignment(Element.ALIGN_CENTER);
            document.add(disclaimer);

            Paragraph thanks = new Paragraph("Thank you for choosing BinaryStack Technologies for your professional development.", footerFont);
            thanks.setAlignment(Element.ALIGN_CENTER);
            document.add(thanks);

        } catch (DocumentException e) {
            log.error("Failed to generate PDF invoice", e);
            throw new RuntimeException("Failed to generate PDF invoice", e);
        } finally {
            document.close();
        }
    }
}
