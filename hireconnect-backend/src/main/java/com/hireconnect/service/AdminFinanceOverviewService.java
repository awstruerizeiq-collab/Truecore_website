package com.hireconnect.service;

import com.hireconnect.dto.request.FinanceDecisionRequest;
import com.hireconnect.dto.response.FinanceDecisionResponse;
import com.hireconnect.dto.response.FinanceOverviewRowDto;
import com.hireconnect.entity.AttendanceSession;
import com.hireconnect.entity.GrossSalaryDetails;
import com.hireconnect.entity.TenantPayslip;
import com.hireconnect.entity.User;
import com.hireconnect.repository.AttendanceSessionRepository;
import com.hireconnect.repository.GrossSalaryDetailsRepository;
import com.hireconnect.repository.TenantPayslipRepository;
import com.hireconnect.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class AdminFinanceOverviewService {

    private final UserRepository userRepository;
    private final AttendanceSessionRepository attendanceSessionRepository;
    private final GrossSalaryDetailsRepository grossSalaryDetailsRepository;
    private final TenantPayslipRepository tenantPayslipRepository;

    public AdminFinanceOverviewService(
            UserRepository userRepository,
            AttendanceSessionRepository attendanceSessionRepository,
            GrossSalaryDetailsRepository grossSalaryDetailsRepository,
            TenantPayslipRepository tenantPayslipRepository
    ) {
        this.userRepository = userRepository;
        this.attendanceSessionRepository = attendanceSessionRepository;
        this.grossSalaryDetailsRepository = grossSalaryDetailsRepository;
        this.tenantPayslipRepository = tenantPayslipRepository;
    }

    public List<FinanceOverviewRowDto> getOverview(String tenantCode, Long companyId, LocalDate startDate, LocalDate endDate) {
        validateDates(startDate, endDate);

        List<User> employees = (companyId == null)
                ? userRepository.findEmployeesByTenantCode(tenantCode)
                : userRepository.findEmployeesByTenantCompany(tenantCode, companyId);

        List<FinanceOverviewRowDto> result = new ArrayList<>();
        for (User employee : employees) {
            BigDecimal attendanceRate = attendanceRate(employee.getId(), startDate, endDate);
            BigDecimal netSalary = attendanceBasedNetSalary(employee.getId(), attendanceRate);

            result.add(new FinanceOverviewRowDto(
                    employee.getEmployeeId(),
                    employee.getFullName(),
                    attendanceRate,
                    netSalary
            ));
        }
        return result;
    }

    @Transactional
    public FinanceDecisionResponse applyDecision(FinanceDecisionRequest request) {
        validateDates(request.getStartDate(), request.getEndDate());

        List<User> employees = (request.getCompanyId() == null)
                ? userRepository.findEmployeesByTenantCode(request.getTenantCode())
                : userRepository.findEmployeesByTenantCompany(request.getTenantCode(), request.getCompanyId());

        int generated = 0;
        int held = 0;

        for (User employee : employees) {
            BigDecimal attendanceRate = attendanceRate(employee.getId(), request.getStartDate(), request.getEndDate());
            BigDecimal netSalary = attendanceBasedNetSalary(employee.getId(), attendanceRate);

            TenantPayslip payslip = tenantPayslipRepository
                    .findByTenantCodeAndEmployeeUserIdAndPeriodStartAndPeriodEnd(
                            request.getTenantCode(), employee.getId(), request.getStartDate(), request.getEndDate()
                    )
                    .orElse(new TenantPayslip());

            payslip.setTenantCode(request.getTenantCode());
            payslip.setCompanyId(request.getCompanyId());
            payslip.setEmployeeUserId(employee.getId());
            payslip.setEmployeeId(employee.getEmployeeId());
            payslip.setEmployeeFullName(employee.getFullName());
            payslip.setPeriodStart(request.getStartDate());
            payslip.setPeriodEnd(request.getEndDate());
            payslip.setAttendanceRate(attendanceRate);
            payslip.setNetSalary(netSalary);

            if (request.getDecision() == FinanceDecisionRequest.Decision.APPROVE) {
                payslip.setDecisionStatus(TenantPayslip.DecisionStatus.APPROVED);
                payslip.setPayslipGenerated(true);
                payslip.setGeneratedAt(LocalDateTime.now());
                generated++;
            } else {
                payslip.setDecisionStatus(TenantPayslip.DecisionStatus.HOLD);
                payslip.setPayslipGenerated(false);
                payslip.setGeneratedAt(null);
                held++;
            }

            tenantPayslipRepository.save(payslip);
        }

        return new FinanceDecisionResponse(
                request.getTenantCode(),
                request.getDecision().name(),
                generated,
                held
        );
    }

    private void validateDates(LocalDate startDate, LocalDate endDate) {
        if (startDate == null || endDate == null) {
            throw new RuntimeException("Start date and end date are required.");
        }
        if (endDate.isBefore(startDate)) {
            throw new RuntimeException("End date must be after or equal to start date.");
        }
    }

    private BigDecimal attendanceBasedNetSalary(Long userId, BigDecimal attendanceRate) {
        GrossSalaryDetails salaryDetails = grossSalaryDetailsRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Gross salary details not found for user: " + userId));

        BigDecimal baseSalary = salaryDetails.getSalary() != null ? salaryDetails.getSalary() : BigDecimal.ZERO;
        return baseSalary.multiply(attendanceRate).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal attendanceRate(Long employeeId, LocalDate startDate, LocalDate endDate) {
        List<AttendanceSession> sessions = attendanceSessionRepository
                .findByEmployeeIdAndDateRange(employeeId, startDate, endDate);

        Map<LocalDate, Integer> maxWorkSecondsPerDay = new HashMap<>();
        for (AttendanceSession session : sessions) {
            if (session.getStartTime() == null) continue;
            LocalDate day = session.getStartTime().toLocalDate();
            int workSeconds = session.getInternalWorkSeconds() == null ? 0 : session.getInternalWorkSeconds();
            maxWorkSecondsPerDay.merge(day, workSeconds, Math::max);
        }

        double payableDays = 0.0;
        for (Integer sec : maxWorkSecondsPerDay.values()) {
            if (sec >= 8 * 3600) payableDays += 1.0;
            else if (sec >= 5 * 3600) payableDays += 0.5;
        }

        long totalDays = ChronoUnit.DAYS.between(startDate, endDate) + 1;
        if (totalDays <= 0) return BigDecimal.ZERO;

        return BigDecimal.valueOf(payableDays)
                .divide(BigDecimal.valueOf(totalDays), 4, RoundingMode.HALF_UP);
    }
}