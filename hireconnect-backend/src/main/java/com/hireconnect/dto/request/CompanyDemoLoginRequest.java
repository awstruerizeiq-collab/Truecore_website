package com.hireconnect.dto.request;

import lombok.Data;

@Data
public class CompanyDemoLoginRequest {
    private String companyEmail;
    private String password;

    public String getCompanyEmail() {
        return companyEmail;
    }

    public void setCompanyEmail(String companyEmail) {
        this.companyEmail = companyEmail;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}