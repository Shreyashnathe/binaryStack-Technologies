package com.binarystack.coaching.dto.auth;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class UserProfileResponse {

    private Long userId;
    private String name;
    private String email;
    private String role;
    private String phoneNumber;
    private String city;
    private String educationLevel;
    private String targetRole;
    private String bio;
    private LocalDate dateOfBirth;
    private LocalDateTime createdAt;
    private boolean passwordSet;

    public UserProfileResponse() {
    }

    public UserProfileResponse(Long userId,
                               String name,
                               String email,
                               String role,
                               String phoneNumber,
                               String city,
                               String educationLevel,
                               String targetRole,
                               String bio,
                               LocalDate dateOfBirth,
                               LocalDateTime createdAt) {
        this.userId = userId;
        this.name = name;
        this.email = email;
        this.role = role;
        this.phoneNumber = phoneNumber;
        this.city = city;
        this.educationLevel = educationLevel;
        this.targetRole = targetRole;
        this.bio = bio;
        this.dateOfBirth = dateOfBirth;
        this.createdAt = createdAt;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getEducationLevel() {
        return educationLevel;
    }

    public void setEducationLevel(String educationLevel) {
        this.educationLevel = educationLevel;
    }

    public String getTargetRole() {
        return targetRole;
    }

    public void setTargetRole(String targetRole) {
        this.targetRole = targetRole;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public LocalDate getDateOfBirth() {
        return dateOfBirth;
    }

    public void setDateOfBirth(LocalDate dateOfBirth) {
        this.dateOfBirth = dateOfBirth;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public boolean isPasswordSet() {
        return passwordSet;
    }

    public void setPasswordSet(boolean passwordSet) {
        this.passwordSet = passwordSet;
    }
}
