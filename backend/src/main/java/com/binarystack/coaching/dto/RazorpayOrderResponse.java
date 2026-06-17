package com.binarystack.coaching.dto;

public class RazorpayOrderResponse {

    private String keyId;
    private String orderId;
    private Long amount;
    private String currency;
    private Long studentId;
    private Long courseId;
    private String courseTitle;
    private String studentName;
    private String studentEmail;
    private String studentContact;

    public RazorpayOrderResponse() {
    }

    public RazorpayOrderResponse(String keyId,
                                 String orderId,
                                 Long amount,
                                 String currency,
                                 Long studentId,
                                 Long courseId,
                                 String courseTitle,
                                 String studentName,
                                 String studentEmail,
                                 String studentContact) {
        this.keyId = keyId;
        this.orderId = orderId;
        this.amount = amount;
        this.currency = currency;
        this.studentId = studentId;
        this.courseId = courseId;
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

    public Long getAmount() {
        return amount;
    }

    public void setAmount(Long amount) {
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

    public Long getCourseId() {
        return courseId;
    }

    public void setCourseId(Long courseId) {
        this.courseId = courseId;
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
