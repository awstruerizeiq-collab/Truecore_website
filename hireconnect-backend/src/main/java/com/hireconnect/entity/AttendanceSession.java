package com.hireconnect.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "attendance_sessions")
public class AttendanceSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Column(name = "total_seconds")
    private Integer totalSeconds = 0;

    @Column(name = "source", length = 50)
    private String source = "manual";

    // ✅ FIX: Initialize to 0 to prevent null constraint violation
    @Column(name = "internal_work_seconds", nullable = false)
    private Integer internalWorkSeconds = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private AttendanceStatus status = AttendanceStatus.WORKING;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum AttendanceStatus {
        WORKING, 
        ON_BREAK, 
        COMPLETED,  // ✅ FULL day (8h+ internal)
        HALF_DAY,   // ✅ Half day (5h internal)  
        PARTIAL,    // ✅ <5h internal hours
        LATE, 
        PRESENT, 
        ABSENT, 
        WEEK_OFF, 
        HOLIDAY, 
        LEAVE, 
        COMPENSATION_OFF, 
        SATURDAY_WORK, 
        SUNDAY_WORK
    }

    // ✅ Default Constructor - IMPORTANT for preventing null
    public AttendanceSession() {
        this.internalWorkSeconds = 0;
        this.totalSeconds = 0;
        this.status = AttendanceStatus.WORKING;
        this.source = "manual";
    }

    // ✅ Constructor with employeeId
    public AttendanceSession(Long employeeId) {
        this.employeeId = employeeId;
        this.internalWorkSeconds = 0;
        this.totalSeconds = 0;
        this.status = AttendanceStatus.WORKING;
        this.source = "manual";
    }

    // ✅ Business methods for internal hour management
    public void setInternalWorkHours(int hours) {
        this.internalWorkSeconds = hours * 3600;
    }

    public double getInternalWorkHours() {
        return internalWorkSeconds != null ? internalWorkSeconds / 3600.0 : 0.0;
    }

    public boolean isFullDay() {
        return internalWorkSeconds != null && internalWorkSeconds >= 8 * 3600;
    }

    public boolean isHalfDay() {
        return internalWorkSeconds != null && internalWorkSeconds >= 5 * 3600 && internalWorkSeconds < 8 * 3600;
    }

    public boolean isPartialDay() {
        return internalWorkSeconds != null && internalWorkSeconds > 0 && internalWorkSeconds < 5 * 3600;
    }

    // ✅ Validation methods
    public boolean isActiveSession() {
        return status == AttendanceStatus.WORKING || status == AttendanceStatus.ON_BREAK;
    }

    public boolean isCompletedSession() {
        return status == AttendanceStatus.COMPLETED || 
               status == AttendanceStatus.HALF_DAY || 
               status == AttendanceStatus.PARTIAL;
    }

    // ✅ Helper method for calendar display status
    public String getCalendarDisplayStatus() {
        if (status == AttendanceStatus.WORKING) {
            return "WORKING";
        } else if (status == AttendanceStatus.ON_BREAK) {
            return "ON_BREAK";
        } else if (isFullDay()) {
            return "FULL";
        } else if (isHalfDay()) {
            return "HALF";
        } else if (isPartialDay()) {
            return "PARTIAL";
        }
        return "ABSENT";
    }

    // ✅ Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(Long employeeId) {
        this.employeeId = employeeId;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public LocalDateTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }

    public Integer getTotalSeconds() {
        return totalSeconds;
    }

    public void setTotalSeconds(Integer totalSeconds) {
        this.totalSeconds = totalSeconds != null ? totalSeconds : 0;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public Integer getInternalWorkSeconds() {
        return internalWorkSeconds;
    }

    public void setInternalWorkSeconds(Integer internalWorkSeconds) {
        // ✅ CRITICAL: Never allow null
        this.internalWorkSeconds = internalWorkSeconds != null ? internalWorkSeconds : 0;
    }

    public AttendanceStatus getStatus() {
        return status;
    }

    public void setStatus(AttendanceStatus status) {
        this.status = status != null ? status : AttendanceStatus.WORKING;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
