package com.hireconnect.dto.request;

import lombok.*;
import java.util.List;

@Data
@Builder
public class PerformanceRequest {
    private String employeeId;
    private String name;
    private String department;
    private String position;
    private Integer currentScore;
    private Integer tasksCompleted;
    private Integer totalTasks;
    private Integer attendance;
    private Integer productivity;
    private Integer qualityScore;
    private Integer punctuality;
    private List<Integer> monthlyScores;
    private Long userId;
	public String getEmployeeId() {
		return employeeId;
	}
	public void setEmployeeId(String employeeId) {
		this.employeeId = employeeId;
	}
	public String getName() {
		return name;
	}
	public void setName(String name) {
		this.name = name;
	}
	public String getDepartment() {
		return department;
	}
	public void setDepartment(String department) {
		this.department = department;
	}
	public String getPosition() {
		return position;
	}
	public void setPosition(String position) {
		this.position = position;
	}
	public Integer getCurrentScore() {
		return currentScore;
	}
	public void setCurrentScore(Integer currentScore) {
		this.currentScore = currentScore;
	}
	public Integer getTasksCompleted() {
		return tasksCompleted;
	}
	public void setTasksCompleted(Integer tasksCompleted) {
		this.tasksCompleted = tasksCompleted;
	}
	public Integer getTotalTasks() {
		return totalTasks;
	}
	public void setTotalTasks(Integer totalTasks) {
		this.totalTasks = totalTasks;
	}
	public Integer getAttendance() {
		return attendance;
	}
	public void setAttendance(Integer attendance) {
		this.attendance = attendance;
	}
	public Integer getProductivity() {
		return productivity;
	}
	public void setProductivity(Integer productivity) {
		this.productivity = productivity;
	}
	public Integer getQualityScore() {
		return qualityScore;
	}
	public void setQualityScore(Integer qualityScore) {
		this.qualityScore = qualityScore;
	}
	public Integer getPunctuality() {
		return punctuality;
	}
	public void setPunctuality(Integer punctuality) {
		this.punctuality = punctuality;
	}
	public List<Integer> getMonthlyScores() {
		return monthlyScores;
	}
	public void setMonthlyScores(List<Integer> monthlyScores) {
		this.monthlyScores = monthlyScores;
	}
	public Long getUserId() {
		return userId;
	}
	public void setUserId(Long userId) {
		this.userId = userId;
	}
    
    
}