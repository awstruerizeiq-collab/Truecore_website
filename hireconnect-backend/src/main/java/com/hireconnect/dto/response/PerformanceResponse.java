package com.hireconnect.dto.response;

import java.time.LocalDateTime;
import java.util.List;

import lombok.Data;

@Data
public class PerformanceResponse {
    private Long id;
    private Long userId;
    private String employeeId;
    private String name;
    private String department;
    private String position;
    private Integer currentScore;
    private String status;
    private Integer tasksCompleted;
    private Integer totalTasks;
    private Integer attendance;
    private Integer productivity;
    private Integer qualityScore;
    private Integer punctuality;
    private Boolean validated;
    private LocalDateTime lastUpdated;
    private List<Integer> monthlyScores;
    private List<FeedbackResponse> feedback;
    
    
	public PerformanceResponse(Long id, Long userId, String employeeId, String name, String department, String position,
			Integer currentScore, String status, Integer tasksCompleted, Integer totalTasks, Integer attendance,
			Integer productivity, Integer qualityScore, Integer punctuality, Boolean validated,
			LocalDateTime lastUpdated, List<Integer> monthlyScores, List<FeedbackResponse> feedback) {
		super();
		this.id = id;
		this.userId = userId;
		this.employeeId = employeeId;
		this.name = name;
		this.department = department;
		this.position = position;
		this.currentScore = currentScore;
		this.status = status;
		this.tasksCompleted = tasksCompleted;
		this.totalTasks = totalTasks;
		this.attendance = attendance;
		this.productivity = productivity;
		this.qualityScore = qualityScore;
		this.punctuality = punctuality;
		this.validated = validated;
		this.lastUpdated = lastUpdated;
		this.monthlyScores = monthlyScores;
		this.feedback = feedback;
	}
	public Long getId() {
		return id;
	}
	public void setId(Long id) {
		this.id = id;
	}
	public Long getUserId() {
		return userId;
	}
	public void setUserId(Long userId) {
		this.userId = userId;
	}
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
	public String getStatus() {
		return status;
	}
	public void setStatus(String status) {
		this.status = status;
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
	public Boolean getValidated() {
		return validated;
	}
	public void setValidated(Boolean validated) {
		this.validated = validated;
	}
	public LocalDateTime getLastUpdated() {
		return lastUpdated;
	}
	public void setLastUpdated(LocalDateTime lastUpdated) {
		this.lastUpdated = lastUpdated;
	}
	public List<Integer> getMonthlyScores() {
		return monthlyScores;
	}
	public void setMonthlyScores(List<Integer> monthlyScores) {
		this.monthlyScores = monthlyScores;
	}
	public List<FeedbackResponse> getFeedback() {
		return feedback;
	}
	public void setFeedback(List<FeedbackResponse> feedback) {
		this.feedback = feedback;
	}
    
    
}
