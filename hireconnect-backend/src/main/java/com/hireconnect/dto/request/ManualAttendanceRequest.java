package com.hireconnect.dto.request;

import java.time.LocalDate;

public class ManualAttendanceRequest {
    
    private String leaveType; // LATE, PRESENT, ABSENT, HALF_DAY, WEEK_OFF, HOLIDAY, LEAVE, COMPENSATION_OFF, SATURDAY_WORK, SUNDAY_WORK
    private LocalDate startDate;
    private LocalDate endDate;
    private String reason;

    public String getLeaveType() {
        return leaveType;
    }

    public void setLeaveType(String leaveType) {
        this.leaveType = leaveType;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}