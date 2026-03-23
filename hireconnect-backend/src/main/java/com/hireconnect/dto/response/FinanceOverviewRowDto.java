package com.hireconnect.dto.response;

import java.math.BigDecimal;

public class FinanceOverviewRowDto {
    private String employeeId;
    private String employeeFullName;
    private BigDecimal attendanceRate;
    private BigDecimal netSalary;

    public FinanceOverviewRowDto() {}

    public FinanceOverviewRowDto(String employeeId, String employeeFullName, BigDecimal attendanceRate, BigDecimal netSalary) {
        this.employeeId = employeeId;
        this.employeeFullName = employeeFullName;
        this.attendanceRate = attendanceRate;
        this.netSalary = netSalary;
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
}
