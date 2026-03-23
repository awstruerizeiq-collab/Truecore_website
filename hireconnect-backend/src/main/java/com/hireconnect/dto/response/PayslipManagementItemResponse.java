package com.hireconnect.dto.response;

import com.hireconnect.entity.PayrollHistory;

import java.math.BigDecimal;
import java.time.LocalDate;

public class PayslipManagementItemResponse {
    private Long payrollId;
    private Long userId;
    private String employeeId;
    private String employeeName;
    private LocalDate payrollMonth;
    private BigDecimal totalEarnings;
    private BigDecimal totalDeductions;
    private BigDecimal netSalary;
    private PayrollHistory.PayrollStatus payrollStatus;
    private Boolean payslipGenerated;
    private String source;
    private String previewUrl;
    private String downloadUrl;

    public Long getPayrollId() {
        return payrollId;
    }

    public void setPayrollId(Long payrollId) {
        this.payrollId = payrollId;
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

    public String getEmployeeName() {
        return employeeName;
    }

    public void setEmployeeName(String employeeName) {
        this.employeeName = employeeName;
    }

    public LocalDate getPayrollMonth() {
        return payrollMonth;
    }

    public void setPayrollMonth(LocalDate payrollMonth) {
        this.payrollMonth = payrollMonth;
    }

    public BigDecimal getTotalEarnings() {
        return totalEarnings;
    }

    public void setTotalEarnings(BigDecimal totalEarnings) {
        this.totalEarnings = totalEarnings;
    }

    public BigDecimal getTotalDeductions() {
        return totalDeductions;
    }

    public void setTotalDeductions(BigDecimal totalDeductions) {
        this.totalDeductions = totalDeductions;
    }

    public BigDecimal getNetSalary() {
        return netSalary;
    }

    public void setNetSalary(BigDecimal netSalary) {
        this.netSalary = netSalary;
    }

    public PayrollHistory.PayrollStatus getPayrollStatus() {
        return payrollStatus;
    }

    public void setPayrollStatus(PayrollHistory.PayrollStatus payrollStatus) {
        this.payrollStatus = payrollStatus;
    }

    public Boolean getPayslipGenerated() {
        return payslipGenerated;
    }

    public void setPayslipGenerated(Boolean payslipGenerated) {
        this.payslipGenerated = payslipGenerated;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public String getPreviewUrl() {
        return previewUrl;
    }

    public void setPreviewUrl(String previewUrl) {
        this.previewUrl = previewUrl;
    }

    public String getDownloadUrl() {
        return downloadUrl;
    }

    public void setDownloadUrl(String downloadUrl) {
        this.downloadUrl = downloadUrl;
    }
}

