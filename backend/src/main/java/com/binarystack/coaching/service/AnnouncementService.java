package com.binarystack.coaching.service;

import com.binarystack.coaching.dto.AnnouncementDto;
import com.binarystack.coaching.entity.Announcement;
import com.binarystack.coaching.enums.AnnouncementAudience;
import com.binarystack.coaching.enums.Role;
import com.binarystack.coaching.exception.ResourceNotFoundException;
import com.binarystack.coaching.repository.AnnouncementRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class AnnouncementService {

    private static final Logger log = LoggerFactory.getLogger(AnnouncementService.class);

    private final AnnouncementRepository announcementRepository;

    public AnnouncementService(AnnouncementRepository announcementRepository) {
        this.announcementRepository = announcementRepository;
    }

    public List<AnnouncementDto> getVisibleAnnouncements(Role role) {
        Objects.requireNonNull(role, "Role must not be null");

        List<AnnouncementAudience> audiences = role == Role.ADMIN
                ? List.of(AnnouncementAudience.ALL, AnnouncementAudience.ADMIN)
                : List.of(AnnouncementAudience.ALL, AnnouncementAudience.STUDENT);

        return announcementRepository.findByActiveTrueAndAudienceInOrderByCreatedAtDesc(audiences)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<AnnouncementDto> getAllAnnouncementsForAdmin() {
        return announcementRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public AnnouncementDto createAnnouncement(AnnouncementDto dto, String createdBy) {
        Announcement announcement = new Announcement();
        announcement.setTitle(dto.getTitle());
        announcement.setMessage(dto.getMessage());
        announcement.setAudience(dto.getAudience() == null ? AnnouncementAudience.ALL : dto.getAudience());
        announcement.setActive(dto.getActive() == null || dto.getActive());
        announcement.setCreatedBy(createdBy);

        Announcement saved = announcementRepository.save(announcement);
        log.info("Announcement created: id={}", saved.getId());
        return toDto(saved);
    }

    @Transactional
    public AnnouncementDto updateAnnouncement(Long id, AnnouncementDto dto) {
        Objects.requireNonNull(id, "Announcement id must not be null");

        Announcement announcement = findByIdOrThrow(id);
        announcement.setTitle(dto.getTitle());
        announcement.setMessage(dto.getMessage());
        announcement.setAudience(dto.getAudience() == null ? AnnouncementAudience.ALL : dto.getAudience());
        announcement.setActive(dto.getActive() == null || dto.getActive());

        Announcement updated = announcementRepository.save(announcement);
        log.info("Announcement updated: id={}", id);
        return toDto(updated);
    }

    @Transactional
    public void deleteAnnouncement(Long id) {
        Objects.requireNonNull(id, "Announcement id must not be null");
        findByIdOrThrow(id);
        announcementRepository.deleteById(id);
        log.info("Announcement deleted: id={}", id);
    }

    private Announcement findByIdOrThrow(Long id) {
        return announcementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Announcement not found with id: " + id));
    }

    private AnnouncementDto toDto(Announcement announcement) {
        return new AnnouncementDto(
                announcement.getId(),
                announcement.getTitle(),
                announcement.getMessage(),
                announcement.getAudience(),
                announcement.getActive(),
                announcement.getCreatedBy(),
                announcement.getCreatedAt(),
                announcement.getUpdatedAt()
        );
    }
}
