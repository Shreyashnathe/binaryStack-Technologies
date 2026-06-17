package com.binarystack.coaching.config;

import com.binarystack.coaching.entity.Course;
import com.binarystack.coaching.entity.User;
import com.binarystack.coaching.enums.Role;
import com.binarystack.coaching.repository.CourseRepository;
import com.binarystack.coaching.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           CourseRepository courseRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.courseRepository = courseRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Value("${app.admin.email}")
    private String adminEmail;

    @Value("${app.admin.password}")
    private String adminPassword;

    @Value("${app.admin.name}")
    private String adminName;

    @Override
    public void run(String... args) {
        if (!userRepository.existsByEmail(adminEmail)) {
            User admin = new User();
            admin.setName(adminName);
            admin.setEmail(adminEmail);
            admin.setPassword(passwordEncoder.encode(adminPassword));
            admin.setRole(Role.ADMIN);
            userRepository.save(admin);
            log.info("✅ Admin user seeded: {}", adminEmail);
        } else {
            log.info("ℹ️  Admin user already exists, skipping seed.");
        }

        seedDummyCourses();
        }

        private void seedDummyCourses() {
        if (courseRepository.count() > 0) {
            log.info("ℹ️  Courses already exist, skipping dummy course seed.");
            return;
        }

        List<Course> courses = List.of(
            createCourse(
                "Java Fundamentals Bootcamp",
                "Core Java, OOP, collections, exception handling, and practical coding drills for beginners.",
                new BigDecimal("1999")),
            createCourse(
                "Spring Boot API Mastery",
                "Build REST APIs with validation, security, JPA, and clean service architecture.",
                new BigDecimal("3499")),
            createCourse(
                "React Frontend Engineering",
                "Modern React with hooks, routing, API integration, and dashboard-focused UI implementation.",
                new BigDecimal("2999")),
            createCourse(
                "Database Design with MySQL",
                "Schema design, indexing, relationships, transactions, and query optimization for production apps.",
                new BigDecimal("2499")),
            createCourse(
                "JWT and Spring Security",
                "Authentication, role-based authorization, token lifecycle, and secure endpoint design.",
                new BigDecimal("2799")),
            createCourse(
                "Full Stack Project Lab",
                "End-to-end project building with backend APIs, frontend UI, deployment readiness, and review cycles.",
                new BigDecimal("3999")),
            createCourse(
                "Data Structures for Interviews",
                "Arrays, linked lists, trees, graphs, recursion, and problem-solving patterns for placements.",
                new BigDecimal("1899")),
            createCourse(
                "Career Preparation and Mock Interviews",
                "Resume refinement, GitHub portfolio polish, communication rounds, and technical mock interviews.",
                BigDecimal.ZERO)
        );

        courseRepository.saveAll(courses);
        log.info("✅ Dummy courses seeded: {}", courses.size());
        }

        private Course createCourse(String title, String description, BigDecimal price) {
        Course course = new Course();
        course.setTitle(title);
        course.setDescription(description);
        course.setPrice(price);
        return course;
    }
}
