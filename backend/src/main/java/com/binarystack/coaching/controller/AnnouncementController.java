package com.binarystack.coaching.controller;

import com.binarystack.coaching.dto.AnnouncementDto;
import com.binarystack.coaching.enums.Role;
import com.binarystack.coaching.service.AnnouncementService;
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
@RequestMapping("/api/announcements")
@Tag(name = "Announcements", description = "Announcement management for coaching workflows")
@SecurityRequirement(name = "bearerAuth")
public class AnnouncementController {

    private final AnnouncementService announcementService;

    public AnnouncementController(AnnouncementService announcementService) {
        this.announcementService = announcementService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN')")
    @Operation(summary = "Get announcements visible to current user")
    public ResponseEntity<List<AnnouncementDto>> getVisibleAnnouncements(Authentication authentication) {
        return ResponseEntity.ok(announcementService.getVisibleAnnouncements(resolveRole(authentication)));
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Admin: get all announcements")
    public ResponseEntity<List<AnnouncementDto>> getAllAnnouncementsForAdmin() {
        return ResponseEntity.ok(announcementService.getAllAnnouncementsForAdmin());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Admin: create announcement")
    public ResponseEntity<AnnouncementDto> createAnnouncement(@Valid @RequestBody AnnouncementDto dto,
                                                              Authentication authentication) {
        String createdBy = authentication != null ? authentication.getName() : "system";
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(announcementService.createAnnouncement(dto, createdBy));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Admin: update announcement")
    public ResponseEntity<AnnouncementDto> updateAnnouncement(@PathVariable Long id,
                                                              @Valid @RequestBody AnnouncementDto dto) {
        return ResponseEntity.ok(announcementService.updateAnnouncement(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Admin: delete announcement")
    public ResponseEntity<Void> deleteAnnouncement(@PathVariable Long id) {
        announcementService.deleteAnnouncement(id);
        return ResponseEntity.noContent().build();
    }

    private Role resolveRole(Authentication authentication) {
        if (authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()))) {
            return Role.ADMIN;
        }
        return Role.STUDENT;
    }
}
