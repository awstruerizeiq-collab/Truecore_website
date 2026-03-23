package com.hireconnect.service;

import java.time.Month;
import java.time.Year;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hireconnect.entity.EarnedLeaveSetting;
import com.hireconnect.entity.EmployeeLeaveBalance;
import com.hireconnect.entity.User;
import com.hireconnect.repository.EarnedLeaveSettingRepository;
import com.hireconnect.repository.EmployeeLeaveBalanceRepository;
import com.hireconnect.repository.UserRepository;

@Service
public class EarnedLeaveService {

    private final EarnedLeaveSettingRepository earnedLeaveSettingRepository;
    private final EmployeeLeaveBalanceRepository employeeLeaveBalanceRepository;
    private final UserRepository userRepository;

    public EarnedLeaveService(
            EarnedLeaveSettingRepository earnedLeaveSettingRepository,
            EmployeeLeaveBalanceRepository employeeLeaveBalanceRepository,
            UserRepository userRepository
    ) {
        this.earnedLeaveSettingRepository = earnedLeaveSettingRepository;
        this.employeeLeaveBalanceRepository = employeeLeaveBalanceRepository;
        this.userRepository = userRepository;
    }

    public Map<String, Object> getQuarterSettings(String tenantCode, Long companyId, Integer year) {
        validateContext(tenantCode, companyId);
        int targetYear = year == null ? Year.now().getValue() : year;

        Map<Integer, Double> monthMap = buildMonthMap(tenantCode, companyId, targetYear);
        return buildSettingsResponse(targetYear, monthMap);
    }

    @Transactional
    public Map<String, Object> updateMonthValue(
            String tenantCode,
            Long companyId,
            Integer year,
            Integer month,
            Double value
    ) {
        validateContext(tenantCode, companyId);
        int targetYear = year == null ? Year.now().getValue() : year;
        if (month == null || month < 1 || month > 12) {
            throw new RuntimeException("Month must be between 1 and 12");
        }
        if (value == null || value < 0) {
            throw new RuntimeException("Earned leave value must be a non-negative number");
        }

        EarnedLeaveSetting setting = earnedLeaveSettingRepository
                .findByTenantCodeAndCompanyIdAndYearAndMonth(tenantCode, companyId, targetYear, month)
                .orElseGet(() -> {
                    EarnedLeaveSetting next = new EarnedLeaveSetting();
                    next.setTenantCode(tenantCode);
                    next.setCompanyId(companyId);
                    next.setYear(targetYear);
                    next.setMonth(month);
                    return next;
                });

        setting.setLeaveValue(roundTwo(value));
        earnedLeaveSettingRepository.save(setting);

        Map<Integer, Double> monthMap = buildMonthMap(tenantCode, companyId, targetYear);
        syncEmployeeBalances(tenantCode, companyId, targetYear, monthMap);
        return buildSettingsResponse(targetYear, monthMap);
    }

    @Transactional
    public Map<String, Object> updateQuarterValues(
            String tenantCode,
            Long companyId,
            Integer year,
            String quarter,
            Map<String, Double> monthValues
    ) {
        validateContext(tenantCode, companyId);
        int targetYear = year == null ? Year.now().getValue() : year;
        if (quarter == null || quarter.isBlank()) {
            throw new RuntimeException("Quarter is required");
        }

        List<Integer> quarterMonths = resolveQuarterMonths(quarter);
        Map<Integer, Double> finalMonthMap = buildMonthMap(tenantCode, companyId, targetYear);

        for (Integer month : quarterMonths) {
            Double nextValue = resolveMonthValue(monthValues, month);
            if (nextValue != null) {
                if (nextValue < 0) {
                    throw new RuntimeException("Earned leave value must be a non-negative number");
                }
                finalMonthMap.put(month, roundTwo(nextValue));
            }
        }

        for (Integer month : quarterMonths) {
            EarnedLeaveSetting setting = earnedLeaveSettingRepository
                    .findByTenantCodeAndCompanyIdAndYearAndMonth(tenantCode, companyId, targetYear, month)
                    .orElseGet(() -> {
                        EarnedLeaveSetting next = new EarnedLeaveSetting();
                        next.setTenantCode(tenantCode);
                        next.setCompanyId(companyId);
                        next.setYear(targetYear);
                        next.setMonth(month);
                        return next;
                    });
            setting.setLeaveValue(roundTwo(finalMonthMap.get(month)));
            earnedLeaveSettingRepository.save(setting);
        }

        syncEmployeeBalances(tenantCode, companyId, targetYear, finalMonthMap);
        return buildSettingsResponse(targetYear, finalMonthMap);
    }

    public Double getEmployeeBalance(Long employeeId, Integer year) {
        int targetYear = year == null ? Year.now().getValue() : year;
        return employeeLeaveBalanceRepository
                .findByEmployeeIdAndYear(employeeId, targetYear)
                .map(EmployeeLeaveBalance::getEarnedLeaveBalance)
                .orElse(0.0);
    }

    private Map<Integer, Double> buildMonthMap(String tenantCode, Long companyId, Integer year) {
        List<EarnedLeaveSetting> settings = earnedLeaveSettingRepository
                .findByTenantCodeAndCompanyIdAndYearOrderByMonthAsc(tenantCode, companyId, year);
        Map<Integer, Double> monthMap = new HashMap<>();
        for (int month = 1; month <= 12; month++) {
            monthMap.put(month, 0.0);
        }
        for (EarnedLeaveSetting setting : settings) {
            monthMap.put(setting.getMonth(), roundTwo(setting.getLeaveValue() == null ? 0.0 : setting.getLeaveValue()));
        }
        return monthMap;
    }

    private Map<String, Object> buildSettingsResponse(Integer year, Map<Integer, Double> monthMap) {
        List<Map<String, Object>> quarters = new ArrayList<>();
        quarters.add(buildQuarter("Q1", 1, 3, monthMap));
        quarters.add(buildQuarter("Q2", 4, 6, monthMap));
        quarters.add(buildQuarter("Q3", 7, 9, monthMap));
        quarters.add(buildQuarter("Q4", 10, 12, monthMap));

        double yearlyTotal = quarters.stream()
                .mapToDouble(q -> (Double) q.get("total"))
                .sum();

        Map<String, Object> response = new HashMap<>();
        response.put("year", year);
        response.put("quarters", quarters);
        response.put("yearlyTotal", roundTwo(yearlyTotal));
        return response;
    }

    private Map<String, Object> buildQuarter(String id, int startMonth, int endMonth, Map<Integer, Double> monthMap) {
        List<Map<String, Object>> months = new ArrayList<>();
        double total = 0.0;
        for (int month = startMonth; month <= endMonth; month++) {
            double value = roundTwo(monthMap.getOrDefault(month, 0.0));
            total += value;
            Map<String, Object> row = new HashMap<>();
            row.put("month", month);
            row.put("monthName", Month.of(month).name());
            row.put("value", value);
            months.add(row);
        }
        Map<String, Object> quarter = new HashMap<>();
        quarter.put("id", id);
        quarter.put("quarter", id);
        quarter.put("months", months);
        quarter.put("total", roundTwo(total));
        return quarter;
    }

    private List<Integer> resolveQuarterMonths(String quarter) {
        String normalized = quarter.trim().toUpperCase();
        return switch (normalized) {
            case "Q1" -> Arrays.asList(1, 2, 3);
            case "Q2" -> Arrays.asList(4, 5, 6);
            case "Q3" -> Arrays.asList(7, 8, 9);
            case "Q4" -> Arrays.asList(10, 11, 12);
            default -> throw new RuntimeException("Invalid quarter: " + quarter);
        };
    }

    private Double resolveMonthValue(Map<String, Double> monthValues, Integer month) {
        if (monthValues == null || monthValues.isEmpty()) {
            return null;
        }

        if (monthValues.containsKey(String.valueOf(month))) {
            return monthValues.get(String.valueOf(month));
        }

        String monthName = Month.of(month).name();
        if (monthValues.containsKey(monthName)) {
            return monthValues.get(monthName);
        }

        String shortName = monthName.substring(0, 3);
        if (monthValues.containsKey(shortName)) {
            return monthValues.get(shortName);
        }

        return null;
    }

    private void syncEmployeeBalances(String tenantCode, Long companyId, Integer year, Map<Integer, Double> monthMap) {
        double yearlyTotal = roundTwo(monthMap.values().stream().mapToDouble(v -> v == null ? 0.0 : v).sum());
        List<User> employees = userRepository.findEmployeesByTenantCompany(tenantCode, companyId);

        for (User employee : employees) {
            EmployeeLeaveBalance balance = employeeLeaveBalanceRepository
                    .findByEmployeeIdAndYear(employee.getId(), year)
                    .orElseGet(() -> {
                        EmployeeLeaveBalance next = new EmployeeLeaveBalance();
                        next.setEmployeeId(employee.getId());
                        next.setTenantCode(tenantCode);
                        next.setCompanyId(companyId);
                        next.setYear(year);
                        return next;
                    });
            balance.setEarnedLeaveBalance(yearlyTotal);
            employeeLeaveBalanceRepository.save(balance);
        }
    }

    private double roundTwo(Double value) {
        double input = value == null ? 0.0 : value;
        return Math.round(input * 100.0) / 100.0;
    }

    private void validateContext(String tenantCode, Long companyId) {
        if (tenantCode == null || tenantCode.isBlank()) {
            throw new RuntimeException("tenantCode is required");
        }
        if (companyId == null) {
            throw new RuntimeException("companyId is required");
        }
    }
}
