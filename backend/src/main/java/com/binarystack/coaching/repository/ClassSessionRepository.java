package com.binarystack.coaching.repository;

import com.binarystack.coaching.entity.ClassSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ClassSessionRepository extends JpaRepository<ClassSession, Long> {

    List<ClassSession> findByActiveTrueAndStartTimeGreaterThanEqualOrderByStartTimeAsc(LocalDateTime startTime);

    List<ClassSession> findAllByOrderByStartTimeAsc();
}
