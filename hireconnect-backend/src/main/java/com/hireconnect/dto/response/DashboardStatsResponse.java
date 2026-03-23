package com.hireconnect.dto.response;

import lombok.Data;

@Data
public class DashboardStatsResponse {
    private Long totalEmployees;
    private Long presentToday;
    private Long onBreak;
    private Long lateToday;
    private Long absentToday;
    private Long workingNow;
    private Long pendingRequests;
	public Long getTotalEmployees() {
		return totalEmployees;
	}
	public void setTotalEmployees(Long totalEmployees) {
		this.totalEmployees = totalEmployees;
	}
	public Long getPresentToday() {
		return presentToday;
	}
	public void setPresentToday(Long presentToday) {
		this.presentToday = presentToday;
	}
	public Long getOnBreak() {
		return onBreak;
	}
	public void setOnBreak(Long onBreak) {
		this.onBreak = onBreak;
	}
	public Long getLateToday() {
		return lateToday;
	}
	public void setLateToday(Long lateToday) {
		this.lateToday = lateToday;
	}
	public Long getAbsentToday() {
		return absentToday;
	}
	public void setAbsentToday(Long absentToday) {
		this.absentToday = absentToday;
	}
	public Long getWorkingNow() {
		return workingNow;
	}
	public void setWorkingNow(Long workingNow) {
		this.workingNow = workingNow;
	}
	public Long getPendingRequests() {
		return pendingRequests;
	}
	public void setPendingRequests(Long pendingRequests) {
		this.pendingRequests = pendingRequests;
	}
    
    
}