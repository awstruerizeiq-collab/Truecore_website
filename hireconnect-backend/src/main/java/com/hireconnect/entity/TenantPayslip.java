package com.hireconnect.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "tenant_payslips",
    uniqueConstraints = @UniqueConstraint(
        columnNames = {"tenant_code", "employee_user_id", "period_start", "period_end"}
    )
)
public class TenantPayslip {

    public enum DecisionStatus {
        APPROVED, HOLD
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_code", nullable = false)
    private String tenantCode;

    @Column(name = "company_id")
    private Long companyId;

    @Column(name = "employee_user_id", nullable = false)
    private Long employeeUserId;

    @Column(name = "employee_id", nullable = false)
    private String employeeId;

    @Column(name = "employee_full_name", nullable = false)
    private String employeeFullName;

    @Column(name = "period_start", nullable = false)
    private LocalDate periodStart;

    @Column(name = "period_end", nullable = false)
    private LocalDate periodEnd;

    @Column(name = "attendance_rate", precision = 5, scale = 4, nullable = false)
    private BigDecimal attendanceRate;

    @Column(name = "net_salary", precision = 12, scale = 2, nullable = false)
    private BigDecimal netSalary;

    @Enumerated(EnumType.STRING)
    @Column(name = "decision_status", nullable = false)
    private DecisionStatus decisionStatus;

    @Column(name = "payslip_generated", nullable = false)
    private Boolean payslipGenerated = false;

    @Column(name = "generated_at")
    private LocalDateTime generatedAt;

    @PrePersist
    public void prePersist() {
        if (payslipGenerated == null) payslipGenerated = false;
    }

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getTenantCode() {
		return tenantCode;
	}

	public void setTenantCode(String tenantCode) {
		this.tenantCode = tenantCode;
	}

	public Long getCompanyId() {
		return companyId;
	}

	public void setCompanyId(Long companyId) {
		this.companyId = companyId;
	}

	public Long getEmployeeUserId() {
		return employeeUserId;
	}

	public void setEmployeeUserId(Long employeeUserId) {
		this.employeeUserId = employeeUserId;
	}

	public String getEmployeeId() {
		return employeeId;
	}

	public void setEmployeeId(String employeeId) {
		this.employeeId = employeeId;
	}

	public String getEmployeeFullName() {
		return employeeFullName;
	}

	public void setEmployeeFullName(String employeeFullName) {
		this.employeeFullName = employeeFullName;
	}

	public LocalDate getPeriodStart() {
		return periodStart;
	}

	public void setPeriodStart(LocalDate periodStart) {
		this.periodStart = periodStart;
	}

	public LocalDate getPeriodEnd() {
		return periodEnd;
	}

	public void setPeriodEnd(LocalDate periodEnd) {
		this.periodEnd = periodEnd;
	}

	public BigDecimal getAttendanceRate() {
		return attendanceRate;
	}

	public void setAttendanceRate(BigDecimal attendanceRate) {
		this.attendanceRate = attendanceRate;
	}

	public BigDecimal getNetSalary() {
		return netSalary;
	}

	public void setNetSalary(BigDecimal netSalary) {
		this.netSalary = netSalary;
	}

	public DecisionStatus getDecisionStatus() {
		return decisionStatus;
	}

	public void setDecisionStatus(DecisionStatus decisionStatus) {
		this.decisionStatus = decisionStatus;
	}

	public Boolean getPayslipGenerated() {
		return payslipGenerated;
	}

	public void setPayslipGenerated(Boolean payslipGenerated) {
		this.payslipGenerated = payslipGenerated;
	}

	public LocalDateTime getGeneratedAt() {
		return generatedAt;
	}

	public void setGeneratedAt(LocalDateTime generatedAt) {
		this.generatedAt = generatedAt;
	}

	

    // getters/setters ...
    // (Generate with IDE)
}