package com.hireconnect.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "biometric_verification_log",
    indexes = {
        @Index(name = "idx_biometric_log_company", columnList = "company_id"),
        @Index(name = "idx_biometric_log_employee", columnList = "employee_id"),
        @Index(name = "idx_biometric_log_created_at", columnList = "created_at")
    }
)
public class BiometricVerificationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    @Column(name = "employee_id", length = 100)
    private String employeeId;

    @Column(name = "module_key", nullable = false, length = 64)
    private String moduleKey;

    @Column(name = "device_name", length = 255)
    private String deviceName;

    @Column(name = "location", length = 255)
    private String location;

    @Column(name = "verified", nullable = false)
    private Boolean verified = Boolean.FALSE;

    @Column(name = "attendance_activated", nullable = false)
    private Boolean attendanceActivated = Boolean.FALSE;

    @Column(name = "message", length = 1000)
    private String message;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (verified == null) {
            verified = Boolean.FALSE;
        }
        if (attendanceActivated == null) {
            attendanceActivated = Boolean.FALSE;
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getCompanyId() {
        return companyId;
    }

    public void setCompanyId(Long companyId) {
        this.companyId = companyId;
    }

    public String getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(String employeeId) {
        this.employeeId = employeeId;
    }

    public String getModuleKey() {
        return moduleKey;
    }

    public void setModuleKey(String moduleKey) {
        this.moduleKey = moduleKey;
    }

    public String getDeviceName() {
        return deviceName;
    }

    public void setDeviceName(String deviceName) {
        this.deviceName = deviceName;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public Boolean getVerified() {
        return verified;
    }

    public void setVerified(Boolean verified) {
        this.verified = verified;
    }

    public Boolean getAttendanceActivated() {
        return attendanceActivated;
    }

    public void setAttendanceActivated(Boolean attendanceActivated) {
        this.attendanceActivated = attendanceActivated;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
