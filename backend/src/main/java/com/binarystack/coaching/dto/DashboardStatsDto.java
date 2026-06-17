package com.binarystack.coaching.dto;

public class DashboardStatsDto {

    private long totalStudents;
    private long totalCourses;
    private long totalEnrollments;

    public DashboardStatsDto() {
    }

    public DashboardStatsDto(long totalStudents, long totalCourses, long totalEnrollments) {
        this.totalStudents = totalStudents;
        this.totalCourses = totalCourses;
        this.totalEnrollments = totalEnrollments;
    }

    public long getTotalStudents() {
        return totalStudents;
    }

    public void setTotalStudents(long totalStudents) {
        this.totalStudents = totalStudents;
    }

    public long getTotalCourses() {
        return totalCourses;
    }

    public void setTotalCourses(long totalCourses) {
        this.totalCourses = totalCourses;
    }

    public long getTotalEnrollments() {
        return totalEnrollments;
    }

    public void setTotalEnrollments(long totalEnrollments) {
        this.totalEnrollments = totalEnrollments;
    }
}
