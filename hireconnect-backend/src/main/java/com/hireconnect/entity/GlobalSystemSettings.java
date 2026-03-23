package com.hireconnect.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "global_system_settings")
public class GlobalSystemSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "platform_name", nullable = false)
    private String platformName = "TrueCoreHR";

    @Column(name = "support_email", nullable = false)
    private String supportEmail = "support@truecorehr.com";

    @Column(name = "default_timezone", nullable = false)
    private String defaultTimezone = "Asia/Kolkata";

    @Column(name = "default_currency", nullable = false)
    private String defaultCurrency = "INR";

    @Column(name = "maintenance_mode", nullable = false)
    private Boolean maintenanceMode = false;

    @Column(name = "allow_company_self_signup", nullable = false)
    private Boolean allowCompanySelfSignup = true;

    @Column(name = "enforce_mfa_for_admins", nullable = false)
    private Boolean enforceMfaForAdmins = false;

    @Column(name = "password_min_length", nullable = false)
    private Integer passwordMinLength = 8;

    @Column(name = "session_timeout_minutes", nullable = false)
    private Integer sessionTimeoutMinutes = 30;

    @Column(name = "max_login_attempts", nullable = false)
    private Integer maxLoginAttempts = 5;

    @Column(name = "email_on_new_company", nullable = false)
    private Boolean emailOnNewCompany = true;

    @Column(name = "email_on_billing_alert", nullable = false)
    private Boolean emailOnBillingAlert = true;

    @Column(name = "audit_retention_days", nullable = false)
    private Integer auditRetentionDays = 180;

    @Column(name = "updated_by")
    private String updatedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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