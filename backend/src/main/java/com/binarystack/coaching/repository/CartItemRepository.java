package com.binarystack.coaching.repository;

import com.binarystack.coaching.entity.CartItem;
import com.binarystack.coaching.entity.Course;
import com.binarystack.coaching.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    List<CartItem> findByStudentId(Long studentId);
    boolean existsByStudentAndCourse(User student, Course course);
    Optional<CartItem> findByStudentAndCourse(User student, Course course);
    void deleteByStudentAndCourse(User student, Course course);
    void deleteByStudentId(Long studentId);
}
