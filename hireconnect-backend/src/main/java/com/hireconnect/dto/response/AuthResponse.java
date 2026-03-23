package com.hireconnect.dto.response;

public class AuthResponse {
    private String token;
    private Long userId;
    private String email;
    private String fullName;
    private String employeeId;
    private String role;
    private String onboardingStatus;
    private String dob;
    private String joiningDate;
    private String tenantCode;
    private String companyName;
    private Long companyId;
    private String companyLegalName;
    private String logoUrl;

    public AuthResponse() {
    }

    public AuthResponse(
        String token,
        Long userId,
        String email,
        String fullName,
        String employeeId,
        String role,
        String onboardingStatus,
        String dob,
        String joiningDate
    ) {
        this.token = token;
        this.userId = userId;
        this.email = email;
        this.fullName = fullName;
        this.employeeId = employeeId;
        this.role = role;
        this.onboardingStatus = onboardingStatus;
        this.dob = dob;
        this.joiningDate = joiningDate;
    }

    public AuthResponse(
        String token,
        Long userId,
        String email,
        String fullName,
        String employeeId,
        String role,
        String onboardingStatus,
        String dob,
        String joiningDate,
        String tenantCode,
        String companyName
    ) {
        this(
            token,
            userId,
            email,
            fullName,
            employeeId,
            role,
            onboardingStatus,
            dob,
            joiningDate
        );
        this.tenantCode = tenantCode;
        this.companyName = companyName;
    }

    public AuthResponse(
        String token,
        Long userId,
        String email,
        String fullName,
        String employeeId,
        String role,
        String onboardingStatus,
        String dob,
        String joiningDate,
        String tenantCode,
        String companyName,
        Long companyId,
        String companyLegalName,
        String logoUrl
    ) {
        this(
            token,
            userId,
            email,
            fullName,
            employeeId,
            role,
            onboardingStatus,
            dob,
            joiningDate,
            tenantCode,
            companyName
        );
        this.companyId = companyId;
        this.companyLegalName = companyLegalName;
        this.logoUrl = logoUrl;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(String employeeId) {
        this.employeeId = employeeId;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getOnboardingStatus() {
        return onboardingStatus;
    }

    public void setOnboardingStatus(String onboardingStatus) {
        this.onboardingStatus = onboardingStatus;
    }

    public String getDob() {
        return dob;
    }

    public void setDob(String dob) {
        this.dob = dob;
    }

    public String getJoiningDate() {
        return joiningDate;
    }

    public void setJoiningDate(String joiningDate) {
        this.joiningDate = joiningDate;
    }

    public String getTenantCode() {
        return tenantCode;
    }

    public void setTenantCode(String tenantCode) {
        this.tenantCode = tenantCode;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public Long getCompanyId() {
        return companyId;
    }

    public void setCompanyId(Long companyId) {
        this.companyId = companyId;
    }

    public String getCompanyLegalName() {
        return companyLegalName;
    }

    public void setCompanyLegalName(String companyLegalName) {
        this.companyLegalName = companyLegalName;
    }

    public String getLogoUrl() {
        return logoUrl;
    }

    public void setLogoUrl(String logoUrl) {
        this.logoUrl = logoUrl;
    }
}
