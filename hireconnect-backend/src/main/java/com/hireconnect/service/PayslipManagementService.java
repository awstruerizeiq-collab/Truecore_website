package com.hireconnect.service;

import com.hireconnect.dto.response.PayrollResponse;
import com.hireconnect.dto.response.PayslipManagementItemResponse;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

@Service
public class PayslipManagementService {

    private final PayrollService payrollService;

    public PayslipManagementService(PayrollService payrollService) {
        this.payrollService = payrollService;
    }

    public List<PayslipManagementItemResponse> listByCompany(Long companyId, String search, String month) {
        final String normalizedSearch = normalize(search);
        final String normalizedMonth = normalize(month);

        return payrollService.getAllPayrollsByCompany(companyId).stream()
                .filter(item -> matchesSearch(item, normalizedSearch))
                .filter(item -> matchesMonth(item, normalizedMonth))
                .map(this::toManagementItem)
                .toList();
    }

    public PayslipManagementItemResponse generateOne(Long companyId, Long payrollId) {
        payrollService.getPayrollById(payrollId, companyId);
        try {
            payrollService.generatePayslip(payrollId);
        } catch (Exception e) {
            throw new RuntimeException(e.getMessage(), e);
        }
        PayrollResponse updated = payrollService.getPayrollById(payrollId, companyId);
        return toManagementItem(updated);
    }

    public int generateBulk(Long companyId, List<Long> payrollIds) {
        if (payrollIds == null || payrollIds.isEmpty()) {
            return 0;
        }
        int generated = 0;
        for (Long payrollId : payrollIds) {
            if (payrollId == null) {
                continue;
            }
            generateOne(companyId, payrollId);
            generated++;
        }
        return generated;
    }

    private PayslipManagementItemResponse toManagementItem(PayrollResponse item) {
        PayslipManagementItemResponse response = new PayslipManagementItemResponse();
        response.setPayrollId(item.getId());
        response.setUserId(item.getUserId());
        response.setEmployeeId(item.getEmployeeId());
        response.setEmployeeName(item.getEmployeeName() != null ? item.getEmployeeName() : item.getUserName());
        response.setPayrollMonth(item.getPayrollMonth());
        response.setTotalEarnings(defaultZero(item.getTotalEarnings()));
        response.setTotalDeductions(defaultZero(item.getTotalDeductions()));
        response.setNetSalary(defaultZero(item.getNetSalary()));
        response.setPayrollStatus(item.getStatus());
        response.setPayslipGenerated(Boolean.TRUE.equals(item.getPayslipGenerated()));
        response.setSource(item.getSource());
        response.setPreviewUrl("/api/payslips/management/" + item.getId() + "/preview");
        response.setDownloadUrl("/api/payslips/management/" + item.getId() + "/download");
        return response;
    }

    private boolean matchesSearch(PayrollResponse item, String search) {
        if (search.isEmpty()) {
            return true;
        }
        String employeeId = normalize(item.getEmployeeId());
        String employeeName = normalize(item.getEmployeeName());
        String userName = normalize(item.getUserName());
        String status = item.getStatus() == null ? "" : normalize(item.getStatus().name());

        return employeeId.contains(search)
                || employeeName.contains(search)
                || userName.contains(search)
                || status.contains(search);
    }

    private boolean matchesMonth(PayrollResponse item, String month) {
        if (month.isEmpty()) {
            return true;
        }
        if (item.getPayrollMonth() == null) {
            return false;
        }
        return item.getPayrollMonth().toString().startsWith(month);
    }

    private String normalize(String value) {
        return String.valueOf(Objects.requireNonNullElse(value, ""))
                .trim()
                .toLowerCase(Locale.ROOT);
    }

    private BigDecimal defaultZero(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}

