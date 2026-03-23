package com.hireconnect.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.*;

@Entity
@Table(name = "performance_data")
public class PerformanceData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ✅ IMPORTANT: tenant_code column in DB
    @Column(name = "tenant_code", nullable = false)
    private String tenantCode;

    @Column(nullable = false, unique = true)
    private String employeeId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String department;

    @Column(nullable = false)
    private String position;

    @Column(nullable = false)
    private Integer currentScore = 0;

    @Column(nullable = false)
    private String status = "Average";

    @Column(nullable = false)
    private Integer tasksCompleted = 0;

    @Column(nullable = false)
    private Integer totalTasks = 0;

    @Column(nullable = false)
    private Integer attendance = 0;

    @Column(nullable = false)
    private Integer productivity = 0;

    @Column(nullable = false)
    private Integer qualityScore = 0;

    @Column(nullable = false)
    private Integer punctuality = 0;

    @Column(nullable = false)
    private Boolean validated = false;

    @Column(nullable = false)
    private LocalDateTime lastUpdated = LocalDateTime.now();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "monthly_scores", joinColumns = @JoinColumn(name = "performance_id"))
    @Column(name = "score")
    private List<Integer> monthlyScores = new ArrayList<>();

    @OneToMany(mappedBy = "performanceData", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<PerformanceFeedback> feedback = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    /* ===================== JPA CALLBACKS ===================== */
    @PrePersist
    @PreUpdate
    public void preSave() {
        this.lastUpdated = LocalDateTime.now();
        updateStatus();
    }

    private void updateStatus() {
        if (currentScore != null && currentScore >= 90) {
            this.status = "Excellent";
        } else if (currentScore != null && currentScore >= 75) {
            this.status = "Good";
        } else if (currentScore != null && currentScore >= 60) {
            this.status = "Average";
        } else {
            this.status = "Needs Improvement";
        }
    }

    /* ===================== GETTERS & SETTERS ===================== */
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTenantCode() { return tenantCode; }
    public void setTenantCode(String tenantCode) { this.tenantCode = tenantCode; }

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getPosition() { return position; }
    public void setPosition(String position) { this.position = position; }

    public Integer getCurrentScore() { return currentScore; }
    public void setCurrentScore(Integer currentScore) { this.currentScore = currentScore; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getTasksCompleted() { return tasksCompleted; }
    public void setTasksCompleted(Integer tasksCompleted) { this.tasksCompleted = tasksCompleted; }

    public Integer getTotalTasks() { return totalTasks; }
    public void setTotalTasks(Integer totalTasks) { this.totalTasks = totalTasks; }

    public Integer getAttendance() { return attendance; }
    public void setAttendance(Integer attendance) { this.attendance = attendance; }

    public Integer getProductivity() { return productivity; }
    public void setProductivity(Integer productivity) { this.productivity = productivity; }

    public Integer getQualityScore() { return qualityScore; }
    public void setQualityScore(Integer qualityScore) { this.qualityScore = qualityScore; }

    public Integer getPunctuality() { return punctuality; }
    public void setPunctuality(Integer punctuality) { this.punctuality = punctuality; }

    public Boolean getValidated() { return validated; }
    public void setValidated(Boolean validated) { this.validated = validated; }

    public LocalDateTime getLastUpdated() { return lastUpdated; }
    public void setLastUpdated(LocalDateTime lastUpdated) { this.lastUpdated = lastUpdated; }

    public List<Integer> getMonthlyScores() { return monthlyScores != null ? monthlyScores : new ArrayList<>(); }
    public void setMonthlyScores(List<Integer> monthlyScores) {
        this.monthlyScores = monthlyScores != null ? monthlyScores : new ArrayList<>();
    }

    public List<PerformanceFeedback> getFeedback() { return feedback != null ? feedback : new ArrayList<>(); }
    public void setFeedback(List<PerformanceFeedback> feedback) {
        this.feedback = feedback != null ? feedback : new ArrayList<>();
    }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
}