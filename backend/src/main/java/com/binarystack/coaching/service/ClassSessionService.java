package com.binarystack.coaching.service;

import com.binarystack.coaching.dto.ClassSessionDto;
import com.binarystack.coaching.entity.ClassSession;
import com.binarystack.coaching.enums.SessionMode;
import com.binarystack.coaching.exception.BadRequestException;
import com.binarystack.coaching.exception.ResourceNotFoundException;
import com.binarystack.coaching.repository.ClassSessionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class ClassSessionService {

    private static final Logger log = LoggerFactory.getLogger(ClassSessionService.class);

    private final ClassSessionRepository classSessionRepository;

    public ClassSessionService(ClassSessionRepository classSessionRepository) {
        this.classSessionRepository = classSessionRepository;
    }

    public List<ClassSessionDto> getUpcomingSessions() {
        return classSessionRepository
                .findByActiveTrueAndStartTimeGreaterThanEqualOrderByStartTimeAsc(LocalDateTime.now())
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<ClassSessionDto> getAllSessionsForAdmin() {
        return classSessionRepository.findAllByOrderByStartTimeAsc()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public ClassSessionDto createSession(ClassSessionDto dto) {
        validateSession(dto);

        ClassSession session = new ClassSession();
        applyDto(session, dto);

        ClassSession saved = classSessionRepository.save(session);
        log.info("Class session created: id={}", saved.getId());
        return toDto(saved);
    }

    @Transactional
    public ClassSessionDto updateSession(Long id, ClassSessionDto dto) {
        Objects.requireNonNull(id, "Session id must not be null");
        validateSession(dto);

        ClassSession session = findByIdOrThrow(id);
        applyDto(session, dto);

        ClassSession updated = classSessionRepository.save(session);
        log.info("Class session updated: id={}", id);
        return toDto(updated);
    }

    @Transactional
    public void deleteSession(Long id) {
        Objects.requireNonNull(id, "Session id must not be null");
        findByIdOrThrow(id);
        classSessionRepository.deleteById(id);
        log.info("Class session deleted: id={}", id);
    }

    private void applyDto(ClassSession session, ClassSessionDto dto) {
        session.setTitle(dto.getTitle());
        session.setDescription(dto.getDescription());
        session.setMentorName(dto.getMentorName());
        session.setStartTime(dto.getStartTime());
        session.setEndTime(dto.getEndTime());
        session.setMode(dto.getMode() == null ? SessionMode.ONLINE : dto.getMode());
        session.setMeetingLink(dto.getMeetingLink());
        session.setLocation(dto.getLocation());
        session.setActive(dto.getActive() == null || dto.getActive());
    }

    private void validateSession(ClassSessionDto dto) {
        LocalDateTime startTime = dto.getStartTime();
        LocalDateTime endTime = dto.getEndTime();

        if (startTime == null || endTime == null) {
            throw new BadRequestException("Start and end time are required");
        }

        if (!endTime.isAfter(startTime)) {
            throw new BadRequestException("End time must be after start time");
        }

        SessionMode mode = dto.getMode() == null ? SessionMode.ONLINE : dto.getMode();
        if ((mode == SessionMode.ONLINE || mode == SessionMode.HYBRID) &&
                (dto.getMeetingLink() == null || dto.getMeetingLink().isBlank())) {
            throw new BadRequestException("Meeting link is required for ONLINE/HYBRID sessions");
        }

        if ((mode == SessionMode.OFFLINE || mode == SessionMode.HYBRID) &&
                (dto.getLocation() == null || dto.getLocation().isBlank())) {
            throw new BadRequestException("Location is required for OFFLINE/HYBRID sessions");
        }
    }

    private ClassSession findByIdOrThrow(Long id) {
        return classSessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Class session not found with id: " + id));
    }

    private ClassSessionDto toDto(ClassSession session) {
        return new ClassSessionDto(
                session.getId(),
                session.getTitle(),
                session.getDescription(),
                session.getMentorName(),
                session.getStartTime(),
                session.getEndTime(),
                session.getMode(),
                session.getMeetingLink(),
                session.getLocation(),
                session.getActive(),
                session.getCreatedAt(),
                session.getUpdatedAt()
        );
    }
}
