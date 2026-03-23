package com.hireconnect.dto.request;

import lombok.Data;
import java.time.LocalDate;

@Data
public class BulkActionRequest {
    private Long employeeId;
    private String status; // Present, Absent, Half Day, Leave, etc.
    private LocalDate startDate;
    private LocalDate endDate;
    private String reason;
	public Long getEmployeeId() {
		return employeeId;
	}
	public void setEmployeeId(Long employeeId) {
		this.employeeId = employeeId;
	}
	public String getStatus() {
		return status;
	}
	public void setStatus(String status) {
		this.status = status;
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