package com.hireconnect.dto.response;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class FinanceSettingsResponse {

    private Long id;
    private Long companyId;
    private String tenantCode;

    private String templateName;
    private String templateVariant;
    private List<String> earningsComponents = new ArrayList<>();
    private List<String> deductionComponents = new ArrayList<>();

    private String payCycle;
    private Integer cycleStartDay;
    private Integer cycleEndDay;
    private Integer payrollProcessingDay;
    private Integer salaryDisbursementDay;

    private Boolean autoGeneratePayslip;
    private Boolean lockPayrollAfterProcessing;
    private Boolean considerAttendance;

    private String updatedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

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

    public List<String> getEarningsComponents() {
        return earningsComponents;
    }

    public void setEarningsComponents(List<String> earningsComponents) {
        this.earningsComponents = earningsComponents;
    }

    public List<String> getDeductionComponents() {
        return deductionComponents;
    }

    public void setDeductionComponents(List<String> deductionComponents) {
        this.deductionComponents = deductionComponents;
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
