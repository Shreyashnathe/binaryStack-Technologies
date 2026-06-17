package com.binarystack.coaching.controller;

import com.binarystack.coaching.dto.ClassSessionDto;
import com.binarystack.coaching.service.ClassSessionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sessions")
@Tag(name = "Class Sessions", description = "Live and upcoming session schedule")
@SecurityRequirement(name = "bearerAuth")
public class ClassSessionController {

    private final ClassSessionService classSessionService;

    public ClassSessionController(ClassSessionService classSessionService) {
        this.classSessionService = classSessionService;
    }

    @GetMapping("/upcoming")
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN')")
    @Operation(summary = "Get upcoming active class sessions")
    public ResponseEntity<List<ClassSessionDto>> getUpcomingSessions() {
        return ResponseEntity.ok(classSessionService.getUpcomingSessions());
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Admin: get all class sessions")
    public ResponseEntity<List<ClassSessionDto>> getAllSessionsForAdmin() {
        return ResponseEntity.ok(classSessionService.getAllSessionsForAdmin());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Admin: create a class session")
    public ResponseEntity<ClassSessionDto> createSession(@Valid @RequestBody ClassSessionDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(classSessionService.createSession(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Admin: update class session")
    public ResponseEntity<ClassSessionDto> updateSession(@PathVariable Long id,
                                                         @Valid @RequestBody ClassSessionDto dto) {
        return ResponseEntity.ok(classSessionService.updateSession(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Admin: delete class session")
    public ResponseEntity<Void> deleteSession(@PathVariable Long id) {
        classSessionService.deleteSession(id);
        return ResponseEntity.noContent().build();
    }
}
