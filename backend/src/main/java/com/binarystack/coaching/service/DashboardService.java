package com.binarystack.coaching.service;

import com.binarystack.coaching.dto.DashboardStatsDto;
import com.binarystack.coaching.enums.Role;
import com.binarystack.coaching.repository.CourseRepository;
import com.binarystack.coaching.repository.EnrollmentRepository;
import com.binarystack.coaching.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class DashboardService {

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;

    public DashboardService(UserRepository userRepository,
                            CourseRepository courseRepository,
                            EnrollmentRepository enrollmentRepository) {
        this.userRepository = userRepository;
        this.courseRepository = courseRepository;
        this.enrollmentRepository = enrollmentRepository;
    }

    public DashboardStatsDto getAdminStats() {
        long totalStudents  = userRepository.countByRole(Role.STUDENT);
        long totalCourses   = courseRepository.count();
        long totalEnrollments = enrollmentRepository.count();

        return new DashboardStatsDto(totalStudents, totalCourses, totalEnrollments);
    }
}
