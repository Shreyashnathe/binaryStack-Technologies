package com.binarystack.coaching.repository;

import com.binarystack.coaching.entity.Announcement;
import com.binarystack.coaching.enums.AnnouncementAudience;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {

    List<Announcement> findAllByOrderByCreatedAtDesc();

    List<Announcement> findByActiveTrueAndAudienceInOrderByCreatedAtDesc(List<AnnouncementAudience> audiences);
}
