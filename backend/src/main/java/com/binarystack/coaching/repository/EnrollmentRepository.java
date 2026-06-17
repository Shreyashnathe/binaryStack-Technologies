package com.binarystack.coaching.repository;

import com.binarystack.coaching.entity.Enrollment;
import com.binarystack.coaching.entity.User;
import com.binarystack.coaching.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {

    List<Enrollment> findByStudent(User student);

    List<Enrollment> findByCourse(Course course);

    boolean existsByStudentAndCourse(User student, Course course);

    Optional<Enrollment> findByStudentAndCourse(User student, Course course);

    long deleteByCourse(Course course);
}
