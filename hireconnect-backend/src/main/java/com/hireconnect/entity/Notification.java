package com.hireconnect.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Enumerated(EnumType.STRING)
    private Priority priority; // LOW, MEDIUM, HIGH

    @Enumerated(EnumType.STRING)
    private Status status; // DRAFT, PUBLISHED, SCHEDULED, ARCHIVED

    private boolean pinned;
    private boolean reqAck; // Require Acknowledgement
    private boolean sendEmail;
    private boolean sendPush;

    // Targeting Logic
    @Enumerated(EnumType.STRING)
    private TargetType targetType; // ALL, DEPT, SPECIFIC

    @ElementCollection
    @CollectionTable(
            name = "notification_target_depts",
            joinColumns = @JoinColumn(name = "notification_id")
    )
    @Column(name = "department")
    private List<String> targetDepts;

    @ElementCollection
    @CollectionTable(
            name = "notification_target_employees",
            joinColumns = @JoinColumn(name = "notification_id")
    )
    @Column(name = "employee_id")
    private List<String> targetEmployeeIds;

    // File Attachment
    private String attachmentName;
    private String attachmentPath; // Path on disk / S3
    private String attachmentContentType;

    @JsonIgnore
    @Lob
    @Column(name = "attachment_data", columnDefinition = "LONGBLOB")
    private byte[] attachmentData;

    // Scheduling
    private LocalDateTime scheduledAt;
    private LocalDateTime expiresAt;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    // -------- Lifecycle Hooks --------

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.scheduledAt == null) {
            this.scheduledAt = LocalDateTime.now();
        }
    }

    // -------- Getters & Setters --------

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Priority getPriority() {
        return priority;
    }

    public void setPriority(Priority priority) {
        this.priority = priority;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public boolean isPinned() {
        return pinned;
    }

    public void setPinned(boolean pinned) {
        this.pinned = pinned;
    }

    public boolean isReqAck() {
        return reqAck;
    }

    public void setReqAck(boolean reqAck) {
        this.reqAck = reqAck;
    }

    public boolean isSendEmail() {
        return sendEmail;
    }

    public void setSendEmail(boolean sendEmail) {
        this.sendEmail = sendEmail;
    }

    public boolean isSendPush() {
        return sendPush;
    }

    public void setSendPush(boolean sendPush) {
        this.sendPush = sendPush;
    }

    public TargetType getTargetType() {
        return targetType;
    }

    public void setTargetType(TargetType targetType) {
        this.targetType = targetType;
    }

    public List<String> getTargetDepts() {
        return targetDepts;
    }

    public void setTargetDepts(List<String> targetDepts) {
        this.targetDepts = targetDepts;
    }

    public List<String> getTargetEmployeeIds() {
        return targetEmployeeIds;
    }

    public void setTargetEmployeeIds(List<String> targetEmployeeIds) {
        this.targetEmployeeIds = targetEmployeeIds;
    }

    public String getAttachmentName() {
        return attachmentName;
    }

    public void setAttachmentName(String attachmentName) {
        this.attachmentName = attachmentName;
    }

    public String getAttachmentPath() {
        return attachmentPath;
    }

    public void setAttachmentPath(String attachmentPath) {
        this.attachmentPath = attachmentPath;
    }

    public String getAttachmentContentType() {
        return attachmentContentType;
    }

    public void setAttachmentContentType(String attachmentContentType) {
        this.attachmentContentType = attachmentContentType;
    }

    public byte[] getAttachmentData() {
        return attachmentData;
    }

    public void setAttachmentData(byte[] attachmentData) {
        this.attachmentData = attachmentData;
    }

    public LocalDateTime getScheduledAt() {
        return scheduledAt;
    }

    public void setScheduledAt(LocalDateTime scheduledAt) {
        this.scheduledAt = scheduledAt;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    // -------- Enums --------

    public enum Priority {
        LOW, MEDIUM, HIGH
    }

    public enum Status {
        DRAFT, PUBLISHED, SCHEDULED, ARCHIVED
    }

    public enum TargetType {
        ALL, DEPT, SPECIFIC
    }
}
