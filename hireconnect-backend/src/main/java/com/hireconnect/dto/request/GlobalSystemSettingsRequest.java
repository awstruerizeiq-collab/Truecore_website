package com.hireconnect.dto.request;

public class GlobalSystemSettingsRequest {
    private String platformName;
    private String supportEmail;
    private String defaultTimezone;
    private String defaultCurrency;
    private Boolean maintenanceMode;
    private Boolean allowCompanySelfSignup;
    private Boolean enforceMfaForAdmins;
    private Integer passwordMinLength;
    private Integer sessionTimeoutMinutes;
    private Integer maxLoginAttempts;
    private Boolean emailOnNewCompany;
    private Boolean emailOnBillingAlert;
    private Integer auditRetentionDays;

    public String getPlatformName() {
        return platformName;
    }

    public void setPlatformName(String platformName) {
        this.platformName = platformName;
    }

    public String getSupportEmail() {
        return supportEmail;
    }

    public void setSupportEmail(String supportEmail) {
        this.supportEmail = supportEmail;
    }

    public String getDefaultTimezone() {
        return defaultTimezone;
    }

    public void setDefaultTimezone(String defaultTimezone) {
        this.defaultTimezone = defaultTimezone;
    }

    public String getDefaultCurrency() {
        return defaultCurrency;
    }

    public void setDefaultCurrency(String defaultCurrency) {
        this.defaultCurrency = defaultCurrency;
    }

    public Boolean getMaintenanceMode() {
        return maintenanceMode;
    }

    public void setMaintenanceMode(Boolean maintenanceMode) {
        this.maintenanceMode = maintenanceMode;
    }

    public Boolean getAllowCompanySelfSignup() {
        return allowCompanySelfSignup;
    }

    public void setAllowCompanySelfSignup(Boolean allowCompanySelfSignup) {
        this.allowCompanySelfSignup = allowCompanySelfSignup;
    }

    public Boolean getEnforceMfaForAdmins() {
        return enforceMfaForAdmins;
    }

    public void setEnforceMfaForAdmins(Boolean enforceMfaForAdmins) {
        this.enforceMfaForAdmins = enforceMfaForAdmins;
    }

    public Integer getPasswordMinLength() {
        return passwordMinLength;
    }

    public void setPasswordMinLength(Integer passwordMinLength) {
        this.passwordMinLength = passwordMinLength;
    }

    public Integer getSessionTimeoutMinutes() {
        return sessionTimeoutMinutes;
    }

    public void setSessionTimeoutMinutes(Integer sessionTimeoutMinutes) {
        this.sessionTimeoutMinutes = sessionTimeoutMinutes;
    }

    public Integer getMaxLoginAttempts() {
        return maxLoginAttempts;
    }

    public void setMaxLoginAttempts(Integer maxLoginAttempts) {
        this.maxLoginAttempts = maxLoginAttempts;
    }

    public Boolean getEmailOnNewCompany() {
        return emailOnNewCompany;
    }

    public void setEmailOnNewCompany(Boolean emailOnNewCompany) {
        this.emailOnNewCompany = emailOnNewCompany;
    }

    public Boolean getEmailOnBillingAlert() {
        return emailOnBillingAlert;
    }

    public void setEmailOnBillingAlert(Boolean emailOnBillingAlert) {
        this.emailOnBillingAlert = emailOnBillingAlert;
    }

    public Integer getAuditRetentionDays() {
        return auditRetentionDays;
    }

    public void setAuditRetentionDays(Integer auditRetentionDays) {
        this.auditRetentionDays = auditRetentionDays;
    }
}