package com.binarystack.coaching.dto;

import java.util.List;

public class RazorpayCartOrderResponse {
    private String keyId;
    private String orderId;
    private long amount;
    private String currency;
    private Long studentId;
    private List<Long> courseIds;
    private String courseTitle; // Custom text containing details of checked-out courses
    private String studentName;
    private String studentEmail;
    private String studentContact;

    public RazorpayCartOrderResponse() {
    }

    public RazorpayCartOrderResponse(String keyId,
                                    String orderId,
                                    long amount,
                                    String currency,
                                    Long studentId,
                                    List<Long> courseIds,
                                    String courseTitle,
                                    String studentName,
                                    String studentEmail,
                                    String studentContact) {
        this.keyId = keyId;
        this.orderId = orderId;
        this.amount = amount;
        this.currency = currency;
        this.studentId = studentId;
        this.courseIds = courseIds;
        this.courseTitle = courseTitle;
        this.studentName = studentName;
        this.studentEmail = studentEmail;
        this.studentContact = studentContact;
    }

    public String getKeyId() {
        return keyId;
    }

    public void setKeyId(String keyId) {
        this.keyId = keyId;
    }

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public long getAmount() {
        return amount;
    }

    public void setAmount(long amount) {
        this.amount = amount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public List<Long> getCourseIds() {
        return courseIds;
    }

    public void setCourseIds(List<Long> courseIds) {
        this.courseIds = courseIds;
    }

    public String getCourseTitle() {
        return courseTitle;
    }

    public void setCourseTitle(String courseTitle) {
        this.courseTitle = courseTitle;
    }

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
    }

    public String getStudentEmail() {
        return studentEmail;
    }

    public void setStudentEmail(String studentEmail) {
        this.studentEmail = studentEmail;
    }

    public String getStudentContact() {
        return studentContact;
    }

    public void setStudentContact(String studentContact) {
        this.studentContact = studentContact;
    }
}
