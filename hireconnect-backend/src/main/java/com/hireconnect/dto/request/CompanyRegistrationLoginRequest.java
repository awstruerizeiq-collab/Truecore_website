package com.hireconnect.dto.request;

import lombok.Data;

@Data
public class CompanyRegistrationLoginRequest {
    private String companyEmail;
    private String companyKey;
//    private String position;
	public String getCompanyEmail() {
		return companyEmail;
	}
	public void setCompanyEmail(String companyEmail) {
		this.companyEmail = companyEmail;
	}
	public String getCompanyKey() {
		return companyKey;
	}
	public void setCompanyKey(String companyKey) {
		this.companyKey = companyKey;
	}
//	public String getPosition() {
//		return position;
//	}
//	public void setPosition(String position) {
//		this.position = position;
//	}
    
    
}