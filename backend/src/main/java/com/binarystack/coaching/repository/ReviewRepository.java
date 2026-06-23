package com.binarystack.coaching.repository;

import com.binarystack.coaching.entity.Review;
import com.binarystack.coaching.entity.User;
import com.binarystack.coaching.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByCourse(Course course);

    List<Review> findByCourseId(Long courseId);

    boolean existsByStudentAndCourse(User student, Course course);

    Optional<Review> findByStudentAndCourse(User student, Course course);
}
