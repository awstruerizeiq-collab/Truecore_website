package com.hireconnect.dto.response;

import java.time.LocalDateTime;

public class AttendanceResponse {
    private Long id;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String status;
    private Integer totalSeconds;
    private Integer totalBreakSeconds;
    private Integer netWorkSeconds;
    private LocalDateTime currentBreakStart;
    private String shiftStartTime;
    private String shiftEndTime;
    private Boolean timesheetSubmitted;
    private String message;
    
    public AttendanceResponse() {}
    
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
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
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
    
    public Integer getTotalSeconds() {
        return totalSeconds;
    }
    
    public void setTotalSeconds(Integer totalSeconds) {
        this.totalSeconds = totalSeconds;
    }
    
    public Integer getTotalBreakSeconds() {
        return totalBreakSeconds;
    }
    
    public void setTotalBreakSeconds(Integer totalBreakSeconds) {
        this.totalBreakSeconds = totalBreakSeconds;
    }
    
    public Integer getNetWorkSeconds() {
        return netWorkSeconds;
    }
    
    public void setNetWorkSeconds(Integer netWorkSeconds) {
        this.netWorkSeconds = netWorkSeconds;
    }
    
    public LocalDateTime getCurrentBreakStart() {
        return currentBreakStart;
    }
    
    public void setCurrentBreakStart(LocalDateTime currentBreakStart) {
        this.currentBreakStart = currentBreakStart;
    }
    
    public String getShiftStartTime() {
        return shiftStartTime;
    }
    
    public void setShiftStartTime(String shiftStartTime) {
        this.shiftStartTime = shiftStartTime;
    }
    
    public String getShiftEndTime() {
        return shiftEndTime;
    }
    
    public void setShiftEndTime(String shiftEndTime) {
        this.shiftEndTime = shiftEndTime;
    }
    
    public Boolean getTimesheetSubmitted() {
        return timesheetSubmitted;
    }
    
    public void setTimesheetSubmitted(Boolean timesheetSubmitted) {
        this.timesheetSubmitted = timesheetSubmitted;
    }
    
    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
    }
}