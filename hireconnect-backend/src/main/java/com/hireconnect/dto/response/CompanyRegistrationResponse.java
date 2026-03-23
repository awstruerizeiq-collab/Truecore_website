package com.hireconnect.dto.response;

public class CompanyRegistrationResponse {

	private Long id;
    private String companyEmail;
    private String companyName;
    private String password;
    private String CompanyKey;
    private String position;
    private String token;
	public Long getId() {
		return id;
	}
	public void setId(Long id) {
		this.id = id;
	}
	public String getCompanyEmail() {
		return companyEmail;
	}
	public void setCompanyEmail(String companyEmail) {
		this.companyEmail = companyEmail;
	}
	public String getCompanyName() {
		return companyName;
	}
	public void setCompanyName(String companyName) {
		this.companyName = companyName;
	}
	public String getPassword() {
		return password;
	}
	public void setPassword(String password) {
		this.password = password;
	}
	public String getCompanyKey() {
		return CompanyKey;
	}
	public void setCompanyKey(String companyKey) {
		CompanyKey = companyKey;
	}
	public String getPosition() {
		return position;
	}
	public void setPosition(String position) {
		this.position = position;
	}
	public String getToken() {
		return token;
	}
	public void setToken(String token) {
		this.token = token;
	}
	

	
}
