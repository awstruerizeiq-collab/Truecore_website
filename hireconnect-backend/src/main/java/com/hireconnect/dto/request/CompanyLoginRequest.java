package com.hireconnect.dto.request;

public class CompanyLoginRequest {
    private String tenantCode;
    private String companyOfficialEmail;
    private String companyOfficialPassword;

    public String getTenantCode() {
        return tenantCode;
    }

    public void setTenantCode(String tenantCode) {
        this.tenantCode = tenantCode;
    }

    public String getCompanyOfficialEmail() {
        return companyOfficialEmail;
    }

    public void setCompanyOfficialEmail(String companyOfficialEmail) {
        this.companyOfficialEmail = companyOfficialEmail;
    }

    public String getCompanyOfficialPassword() {
        return companyOfficialPassword;
    }

    public void setCompanyOfficialPassword(String companyOfficialPassword) {
        this.companyOfficialPassword = companyOfficialPassword;
    }
}