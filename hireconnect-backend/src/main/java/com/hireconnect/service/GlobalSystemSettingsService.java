package com.hireconnect.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hireconnect.dto.request.GlobalSystemSettingsRequest;
import com.hireconnect.entity.GlobalSystemSettings;
import com.hireconnect.repository.GlobalSystemSettingsRepository;

@Service
public class GlobalSystemSettingsService {

    private final GlobalSystemSettingsRepository repository;

    public GlobalSystemSettingsService(GlobalSystemSettingsRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public GlobalSystemSettings getSettings() {
        GlobalSystemSettings existing = repository.findTopByOrderByIdAsc();
        return existing != null ? existing : buildDefaults();
    }

    @Transactional
    public GlobalSystemSettings updateSettings(GlobalSystemSettingsRequest request, String updatedBy) {
        GlobalSystemSettings settings = repository.findTopByOrderByIdAsc();
        if (settings == null) {
            settings = buildDefaults();
        }

        if (request.getPlatformName() != null && !request.getPlatformName().isBlank()) {
            settings.setPlatformName(request.getPlatformName().trim());
        }
        if (request.getSupportEmail() != null && !request.getSupportEmail().isBlank()) {
            settings.setSupportEmail(request.getSupportEmail().trim().toLowerCase());
        }
        if (request.getDefaultTimezone() != null && !request.getDefaultTimezone().isBlank()) {
            settings.setDefaultTimezone(request.getDefaultTimezone().trim());
        }
        if (request.getDefaultCurrency() != null && !request.getDefaultCurrency().isBlank()) {
            settings.setDefaultCurrency(request.getDefaultCurrency().trim().toUpperCase());
        }
        if (request.getMaintenanceMode() != null) {
            settings.setMaintenanceMode(request.getMaintenanceMode());
        }
        if (request.getAllowCompanySelfSignup() != null) {
            settings.setAllowCompanySelfSignup(request.getAllowCompanySelfSignup());
        }
        if (request.getEnforceMfaForAdmins() != null) {
            settings.setEnforceMfaForAdmins(request.getEnforceMfaForAdmins());
        }
        if (request.getPasswordMinLength() != null) {
            settings.setPasswordMinLength(Math.max(6, request.getPasswordMinLength()));
        }
        if (request.getSessionTimeoutMinutes() != null) {
            settings.setSessionTimeoutMinutes(Math.max(5, request.getSessionTimeoutMinutes()));
        }
        if (request.getMaxLoginAttempts() != null) {
            settings.setMaxLoginAttempts(Math.max(3, request.getMaxLoginAttempts()));
        }
        if (request.getEmailOnNewCompany() != null) {
            settings.setEmailOnNewCompany(request.getEmailOnNewCompany());
        }
        if (request.getEmailOnBillingAlert() != null) {
            settings.setEmailOnBillingAlert(request.getEmailOnBillingAlert());
        }
        if (request.getAuditRetentionDays() != null) {
            settings.setAuditRetentionDays(Math.max(30, request.getAuditRetentionDays()));
        }
        settings.setUpdatedBy(updatedBy);

        return repository.save(settings);
    }

    private GlobalSystemSettings buildDefaults() {
        GlobalSystemSettings defaults = new GlobalSystemSettings();
        defaults.setPlatformName("TrueCoreHR");
        defaults.setSupportEmail("support@truecorehr.com");
        defaults.setDefaultTimezone("Asia/Kolkata");
        defaults.setDefaultCurrency("INR");
        defaults.setMaintenanceMode(false);
        defaults.setAllowCompanySelfSignup(true);
        defaults.setEnforceMfaForAdmins(false);
        defaults.setPasswordMinLength(8);
        defaults.setSessionTimeoutMinutes(30);
        defaults.setMaxLoginAttempts(5);
        defaults.setEmailOnNewCompany(true);
        defaults.setEmailOnBillingAlert(true);
        defaults.setAuditRetentionDays(180);
        return defaults;
    }
}