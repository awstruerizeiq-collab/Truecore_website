package com.hireconnect.service;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hireconnect.dto.request.FinanceSettingsRequest;
import com.hireconnect.dto.response.FinanceSettingsResponse;
import com.hireconnect.entity.FinanceSettings;
import com.hireconnect.repository.FinanceSettingsRepository;

@Service
public class FinanceSettingsService {

    private static final List<String> DEFAULT_EARNINGS_COMPONENTS = List.of(
        "Basic Salary",
        "House Rent Allowance",
        "Special Allowance"
    );

    private static final List<String> DEFAULT_DEDUCTION_COMPONENTS = List.of(
        "Provident Fund",
        "Professional Tax",
        "TDS"
    );

    private static final Set<String> ALLOWED_PAY_CYCLES = Set.of(
        "MONTHLY",
        "SEMI_MONTHLY",
        "BI_WEEKLY",
        "WEEKLY"
    );

    private static final Set<String> ALLOWED_TEMPLATE_VARIANTS = Set.of(
        "template_1",
        "template_2",
        "template_3"
    );

    private final FinanceSettingsRepository repository;
    private final ObjectMapper objectMapper;
    private final UserService userService;

    public FinanceSettingsService(
        FinanceSettingsRepository repository,
        ObjectMapper objectMapper,
        UserService userService
    ) {
        this.repository = repository;
        this.objectMapper = objectMapper;
        this.userService = userService;
    }

    @Transactional(readOnly = true)
    public FinanceSettingsResponse getSettings(Long companyId, String tenantCode) {
        if (companyId == null) {
            throw new RuntimeException("companyId is required");
        }

        FinanceSettings settings = repository.findByCompanyId(companyId)
            .orElseGet(() -> buildDefaults(companyId, tenantCode));
        return toResponse(settings);
    }

    @Transactional
    public FinanceSettingsResponse saveOrUpdate(Long companyId, String tenantCode, FinanceSettingsRequest request) {
        if (companyId == null) {
            throw new RuntimeException("companyId is required");
        }

        FinanceSettings settings = repository.findByCompanyId(companyId)
            .orElseGet(() -> buildDefaults(companyId, tenantCode));

        settings.setCompanyId(companyId);
        if (tenantCode != null && !tenantCode.isBlank()) {
            settings.setTenantCode(tenantCode.trim());
        }

        if (request.getTemplateName() != null) {
            String templateName = request.getTemplateName().trim();
            if (templateName.isEmpty()) {
                throw new RuntimeException("templateName cannot be blank");
            }
            settings.setTemplateName(templateName);
        }

        settings.setTemplateVariant(normalizeTemplateVariant(request.getTemplateVariant(), settings.getTemplateVariant()));

        if (request.getEarningsComponents() != null) {
            List<String> cleaned = sanitizeComponents(request.getEarningsComponents(), DEFAULT_EARNINGS_COMPONENTS);
            settings.setEarningsComponentsJson(toJson(cleaned));
        }

        if (request.getDeductionComponents() != null) {
            List<String> cleaned = sanitizeComponents(request.getDeductionComponents(), DEFAULT_DEDUCTION_COMPONENTS);
            settings.setDeductionComponentsJson(toJson(cleaned));
        }

        if (request.getPayCycle() != null) {
            settings.setPayCycle(validatePayCycle(request.getPayCycle()));
        }

        if (request.getCycleStartDay() != null) {
            settings.setCycleStartDay(validateDay("cycleStartDay", request.getCycleStartDay()));
        }
        if (request.getCycleEndDay() != null) {
            settings.setCycleEndDay(validateDay("cycleEndDay", request.getCycleEndDay()));
        }
        if (request.getPayrollProcessingDay() != null) {
            settings.setPayrollProcessingDay(validateDay("payrollProcessingDay", request.getPayrollProcessingDay()));
        }
        if (request.getSalaryDisbursementDay() != null) {
            settings.setSalaryDisbursementDay(validateDay("salaryDisbursementDay", request.getSalaryDisbursementDay()));
        }

        if (settings.getCycleStartDay() != null
            && settings.getCycleEndDay() != null
            && settings.getCycleEndDay() < settings.getCycleStartDay()) {
            throw new RuntimeException("cycleEndDay must be greater than or equal to cycleStartDay");
        }

        if (request.getAutoGeneratePayslip() != null) {
            settings.setAutoGeneratePayslip(request.getAutoGeneratePayslip());
        }
        if (request.getLockPayrollAfterProcessing() != null) {
            settings.setLockPayrollAfterProcessing(request.getLockPayrollAfterProcessing());
        }
        if (request.getConsiderAttendance() != null) {
            settings.setConsiderAttendance(request.getConsiderAttendance());
        }

        settings.setUpdatedBy(resolveUpdater());

        FinanceSettings saved = repository.save(settings);
        return toResponse(saved);
    }

    private FinanceSettings buildDefaults(Long companyId, String tenantCode) {
        FinanceSettings defaults = new FinanceSettings();
        defaults.setCompanyId(companyId);
        defaults.setTenantCode(tenantCode == null || tenantCode.isBlank() ? null : tenantCode.trim());
        defaults.setTemplateName("Standard Payroll");
        defaults.setTemplateVariant("template_1");
        defaults.setEarningsComponentsJson(toJson(DEFAULT_EARNINGS_COMPONENTS));
        defaults.setDeductionComponentsJson(toJson(DEFAULT_DEDUCTION_COMPONENTS));
        defaults.setPayCycle("MONTHLY");
        defaults.setCycleStartDay(1);
        defaults.setCycleEndDay(30);
        defaults.setPayrollProcessingDay(28);
        defaults.setSalaryDisbursementDay(30);
        defaults.setAutoGeneratePayslip(true);
        defaults.setLockPayrollAfterProcessing(true);
        defaults.setConsiderAttendance(true);
        return defaults;
    }

    private FinanceSettingsResponse toResponse(FinanceSettings entity) {
        FinanceSettingsResponse response = new FinanceSettingsResponse();
        response.setId(entity.getId());
        response.setCompanyId(entity.getCompanyId());
        response.setTenantCode(entity.getTenantCode());
        response.setTemplateName(entity.getTemplateName());
        response.setTemplateVariant(normalizeTemplateVariant(entity.getTemplateVariant(), "template_1"));
        response.setEarningsComponents(parseComponents(entity.getEarningsComponentsJson(), DEFAULT_EARNINGS_COMPONENTS));
        response.setDeductionComponents(parseComponents(entity.getDeductionComponentsJson(), DEFAULT_DEDUCTION_COMPONENTS));
        response.setPayCycle(normalizePayCycleOrDefault(entity.getPayCycle()));
        response.setCycleStartDay(entity.getCycleStartDay());
        response.setCycleEndDay(entity.getCycleEndDay());
        response.setPayrollProcessingDay(entity.getPayrollProcessingDay());
        response.setSalaryDisbursementDay(entity.getSalaryDisbursementDay());
        response.setAutoGeneratePayslip(Boolean.TRUE.equals(entity.getAutoGeneratePayslip()));
        response.setLockPayrollAfterProcessing(Boolean.TRUE.equals(entity.getLockPayrollAfterProcessing()));
        response.setConsiderAttendance(Boolean.TRUE.equals(entity.getConsiderAttendance()));
        response.setUpdatedBy(entity.getUpdatedBy());
        response.setCreatedAt(entity.getCreatedAt());
        response.setUpdatedAt(entity.getUpdatedAt());
        return response;
    }

    private List<String> parseComponents(String rawJson, List<String> fallback) {
        if (rawJson == null || rawJson.isBlank()) {
            return fallback;
        }
        try {
            List<String> raw = objectMapper.readValue(rawJson, new TypeReference<List<String>>() {});
            return sanitizeComponents(raw, fallback);
        } catch (Exception ex) {
            return fallback;
        }
    }

    private List<String> sanitizeComponents(List<String> values, List<String> fallback) {
        if (values == null) {
            return fallback;
        }

        LinkedHashSet<String> cleaned = new LinkedHashSet<>();
        for (String value : values) {
            if (value == null) continue;
            String normalized = value.trim();
            if (!normalized.isEmpty()) {
                cleaned.add(normalized);
            }
        }

        if (cleaned.isEmpty()) {
            return fallback;
        }
        return List.copyOf(cleaned);
    }

    private String toJson(List<String> values) {
        try {
            return objectMapper.writeValueAsString(values == null ? List.of() : values);
        } catch (Exception ex) {
            throw new RuntimeException("Failed to serialize components");
        }
    }

    private String normalizeTemplateVariant(String value, String fallback) {
        String base = fallback == null || fallback.isBlank() ? "template_1" : fallback.trim().toLowerCase();
        if (!ALLOWED_TEMPLATE_VARIANTS.contains(base)) {
            base = "template_1";
        }

        if (value == null) {
            return base;
        }
        String normalized = value.trim().toLowerCase();
        if (!ALLOWED_TEMPLATE_VARIANTS.contains(normalized)) {
            throw new RuntimeException("templateVariant must be one of template_1, template_2, template_3");
        }
        return normalized;
    }

    private String validatePayCycle(String value) {
        String normalized = value == null ? "" : value.trim().toUpperCase();
        if (!ALLOWED_PAY_CYCLES.contains(normalized)) {
            throw new RuntimeException("payCycle must be MONTHLY, SEMI_MONTHLY, BI_WEEKLY, or WEEKLY");
        }
        return normalized;
    }

    private String normalizePayCycleOrDefault(String value) {
        String normalized = value == null ? "" : value.trim().toUpperCase();
        if (!ALLOWED_PAY_CYCLES.contains(normalized)) {
            return "MONTHLY";
        }
        return normalized;
    }

    private int validateDay(String fieldName, Integer dayValue) {
        if (dayValue == null || dayValue < 1 || dayValue > 31) {
            throw new RuntimeException(fieldName + " must be between 1 and 31");
        }
        return dayValue;
    }

    private String resolveUpdater() {
        try {
            String email = userService.getCurrentUser().getEmail();
            if (email != null && !email.isBlank()) {
                return email.trim().toLowerCase();
            }
        } catch (Exception ignored) {
            // Fallback for requests where auth context is unavailable.
        }
        return "system";
    }
}
