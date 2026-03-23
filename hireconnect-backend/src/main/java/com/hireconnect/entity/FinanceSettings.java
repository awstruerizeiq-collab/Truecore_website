package com.hireconnect.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
    name = "finance_settings",
    uniqueConstraints = @UniqueConstraint(name = "uk_finance_settings_company", columnNames = "company_id")
)
public class FinanceSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    @Column(name = "tenant_code")
    private String tenantCode;

    @Column(name = "template_name", nullable = false, length = 120)
    private String templateName = "Standard Payroll";

    @Column(name = "template_variant", nullable = false, length = 30)
    private String templateVariant = "template_1";

    @Column(name = "earnings_components_json", nullable = false, columnDefinition = "LONGTEXT")
    private String earningsComponentsJson = "[]";

    @Column(name = "deduction_components_json", nullable = false, columnDefinition = "LONGTEXT")
    private String deductionComponentsJson = "[]";

    @Column(name = "pay_cycle", nullable = false, length = 30)
    private String payCycle = "MONTHLY";

    @Column(name = "cycle_start_day", nullable = false)
    private Integer cycleStartDay = 1;

    @Column(name = "cycle_end_day", nullable = false)
    private Integer cycleEndDay = 30;

    @Column(name = "payroll_processing_day", nullable = false)
    private Integer payrollProcessingDay = 28;

    @Column(name = "salary_disbursement_day", nullable = false)
    private Integer salaryDisbursementDay = 30;

    @Column(name = "auto_generate_payslip", nullable = false)
    private Boolean autoGeneratePayslip = true;

    @Column(name = "lock_payroll_after_processing", nullable = false)
    private Boolean lockPayrollAfterProcessing = true;

    @Column(name = "consider_attendance", nullable = false)
    private Boolean considerAttendance = true;

    @Column(name = "updated_by")
    private String updatedBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (templateName == null || templateName.isBlank()) {
            templateName = "Standard Payroll";
        }
        if (templateVariant == null || templateVariant.isBlank()) {
            templateVariant = "template_1";
        }
        if (earningsComponentsJson == null || earningsComponentsJson.isBlank()) {
            earningsComponentsJson = "[]";
        }
        if (deductionComponentsJson == null || deductionComponentsJson.isBlank()) {
            deductionComponentsJson = "[]";
        }
        if (payCycle == null || payCycle.isBlank()) {
            payCycle = "MONTHLY";
        }
        if (cycleStartDay == null) {
            cycleStartDay = 1;
        }
        if (cycleEndDay == null) {
            cycleEndDay = 30;
        }
        if (payrollProcessingDay == null) {
            payrollProcessingDay = 28;
        }
        if (salaryDisbursementDay == null) {
            salaryDisbursementDay = 30;
        }
        if (autoGeneratePayslip == null) {
            autoGeneratePayslip = true;
        }
        if (lockPayrollAfterProcessing == null) {
            lockPayrollAfterProcessing = true;
        }
        if (considerAttendance == null) {
            considerAttendance = true;
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

    public String getTenantCode() {
        return tenantCode;
    }

    public void setTenantCode(String tenantCode) {
        this.tenantCode = tenantCode;
    }

    public String getTemplateName() {
        return templateName;
    }

    public void setTemplateName(String templateName) {
        this.templateName = templateName;
    }

    public String getTemplateVariant() {
        return templateVariant;
    }

    public void setTemplateVariant(String templateVariant) {
        this.templateVariant = templateVariant;
    }

    public String getEarningsComponentsJson() {
        return earningsComponentsJson;
    }

    public void setEarningsComponentsJson(String earningsComponentsJson) {
        this.earningsComponentsJson = earningsComponentsJson;
    }

    public String getDeductionComponentsJson() {
        return deductionComponentsJson;
    }

    public void setDeductionComponentsJson(String deductionComponentsJson) {
        this.deductionComponentsJson = deductionComponentsJson;
    }

    public String getPayCycle() {
        return payCycle;
    }

    public void setPayCycle(String payCycle) {
        this.payCycle = payCycle;
    }

    public Integer getCycleStartDay() {
        return cycleStartDay;
    }

    public void setCycleStartDay(Integer cycleStartDay) {
        this.cycleStartDay = cycleStartDay;
    }

    public Integer getCycleEndDay() {
        return cycleEndDay;
    }

    public void setCycleEndDay(Integer cycleEndDay) {
        this.cycleEndDay = cycleEndDay;
    }

    public Integer getPayrollProcessingDay() {
        return payrollProcessingDay;
    }

    public void setPayrollProcessingDay(Integer payrollProcessingDay) {
        this.payrollProcessingDay = payrollProcessingDay;
    }

    public Integer getSalaryDisbursementDay() {
        return salaryDisbursementDay;
    }

    public void setSalaryDisbursementDay(Integer salaryDisbursementDay) {
        this.salaryDisbursementDay = salaryDisbursementDay;
    }

    public Boolean getAutoGeneratePayslip() {
        return autoGeneratePayslip;
    }

    public void setAutoGeneratePayslip(Boolean autoGeneratePayslip) {
        this.autoGeneratePayslip = autoGeneratePayslip;
    }

    public Boolean getLockPayrollAfterProcessing() {
        return lockPayrollAfterProcessing;
    }

    public void setLockPayrollAfterProcessing(Boolean lockPayrollAfterProcessing) {
        this.lockPayrollAfterProcessing = lockPayrollAfterProcessing;
    }

    public Boolean getConsiderAttendance() {
        return considerAttendance;
    }

    public void setConsiderAttendance(Boolean considerAttendance) {
        this.considerAttendance = considerAttendance;
    }

    public String getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(String updatedBy) {
        this.updatedBy = updatedBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
