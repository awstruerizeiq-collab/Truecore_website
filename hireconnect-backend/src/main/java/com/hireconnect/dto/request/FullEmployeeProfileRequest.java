package com.hireconnect.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class FullEmployeeProfileRequest {

    @Valid
    @NotNull
    private RegisterRequest user;

    @Valid
    @NotNull
    private PersonalDetailsDto personalDetails;

    @Valid
    @NotNull
    private EmployeeDetailsDto employeeDetails;

    @Valid
    @NotNull
    private AccountDetailsDto accountDetails;

    @Valid
    @NotNull
    private GrossSalaryDetailsDto grossSalaryDetails;

	public RegisterRequest getUser() {
		return user;
	}

	public void setUser(RegisterRequest user) {
		this.user = user;
	}

	public PersonalDetailsDto getPersonalDetails() {
		return personalDetails;
	}

	public void setPersonalDetails(PersonalDetailsDto personalDetails) {
		this.personalDetails = personalDetails;
	}

	public EmployeeDetailsDto getEmployeeDetails() {
		return employeeDetails;
	}

	public void setEmployeeDetails(EmployeeDetailsDto employeeDetails) {
		this.employeeDetails = employeeDetails;
	}

	public AccountDetailsDto getAccountDetails() {
		return accountDetails;
	}

	public void setAccountDetails(AccountDetailsDto accountDetails) {
		this.accountDetails = accountDetails;
	}

	public GrossSalaryDetailsDto getGrossSalaryDetails() {
		return grossSalaryDetails;
	}

	public void setGrossSalaryDetails(GrossSalaryDetailsDto grossSalaryDetails) {
		this.grossSalaryDetails = grossSalaryDetails;
	}

	}