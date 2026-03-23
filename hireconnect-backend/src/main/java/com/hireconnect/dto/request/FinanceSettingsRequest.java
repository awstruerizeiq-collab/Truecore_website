package com.hireconnect.dto.request;

import java.util.List;

public class FinanceSettingsRequest {

    private Long companyId;
    private String tenantCode;

    private String templateName;
    private String templateVariant;
    private List<String> earningsComponents;
    private List<String> deductionComponents;

    private String payCycle;
    private Integer cycleStartDay;
    private Integer cycleEndDay;
    private Integer payrollProcessingDay;
    private Integer salaryDisbursementDay;

    private Boolean autoGeneratePayslip;
    private Boolean lockPayrollAfterProcessing;
    private Boolean considerAttendance;

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
}
