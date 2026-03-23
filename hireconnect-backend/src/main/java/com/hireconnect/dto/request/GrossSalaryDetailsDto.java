package com.hireconnect.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class GrossSalaryDetailsDto {

    private Long id;

    private String tenantCode;

    private Long companyId;
    private String companyName;

    private String employeeId;

    @NotNull
    private BigDecimal salary;

    private LocalDate companyJoinDate;

    private BigDecimal basicSalary;
    private BigDecimal hra;
    private BigDecimal conveyanceAllowance;
    private BigDecimal medicalAllowance;
    private BigDecimal medicalInsurance;
    private BigDecimal lta;
    private BigDecimal specialAllowance;
    private BigDecimal otherAllowances;
    private BigDecimal esic;
    private BigDecimal deductions;
    private BigDecimal pfEmployeeContribution;
    private BigDecimal professionalTax;
    private BigDecimal taxDeductions;
    private BigDecimal otherDeductions;
    private BigDecimal netSalary;

    private Boolean esiApplicable;
    private String esiNumber;
    private String esiDispensary;

    private Boolean pfApplicable;
    private String pfNumber;
    private String uanNumber;

    private Boolean rejoin;
    private String previousEmployeeId;
    private String remark;
	public Long getId() {
		return id;
	}
	public void setId(Long id) {
		this.id = id;
	}
	public String getTenantCode() {
		return tenantCode;
	}
	public void setTenantCode(String tenantCode) {
		this.tenantCode = tenantCode;
	}
	public Long getCompanyId() {
		return companyId;
	}
	public void setCompanyId(Long companyId) {
		this.companyId = companyId;
	}
	public String getCompanyName() {
		return companyName;
	}
	public void setCompanyName(String companyName) {
		this.companyName = companyName;
	}
	public String getEmployeeId() {
		return employeeId;
	}
	public void setEmployeeId(String employeeId) {
		this.employeeId = employeeId;
	}
	public BigDecimal getSalary() {
		return salary;
	}
	public void setSalary(BigDecimal salary) {
		this.salary = salary;
	}
	public LocalDate getCompanyJoinDate() {
		return companyJoinDate;
	}
	public void setCompanyJoinDate(LocalDate companyJoinDate) {
		this.companyJoinDate = companyJoinDate;
	}
	public BigDecimal getBasicSalary() {
		return basicSalary;
	}
	public void setBasicSalary(BigDecimal basicSalary) {
		this.basicSalary = basicSalary;
	}
	public BigDecimal getHra() {
		return hra;
	}
	public void setHra(BigDecimal hra) {
		this.hra = hra;
	}
	public BigDecimal getConveyanceAllowance() {
		return conveyanceAllowance;
	}
	public void setConveyanceAllowance(BigDecimal conveyanceAllowance) {
		this.conveyanceAllowance = conveyanceAllowance;
	}
	public BigDecimal getMedicalAllowance() {
		return medicalAllowance;
	}
	public void setMedicalAllowance(BigDecimal medicalAllowance) {
		this.medicalAllowance = medicalAllowance;
	}
	public BigDecimal getMedicalInsurance() {
		return medicalInsurance;
	}
	public void setMedicalInsurance(BigDecimal medicalInsurance) {
		this.medicalInsurance = medicalInsurance;
	}
	public BigDecimal getLta() {
		return lta;
	}
	public void setLta(BigDecimal lta) {
		this.lta = lta;
	}
	public BigDecimal getSpecialAllowance() {
		return specialAllowance;
	}
	public void setSpecialAllowance(BigDecimal specialAllowance) {
		this.specialAllowance = specialAllowance;
	}
	public BigDecimal getOtherAllowances() {
		return otherAllowances;
	}
	public void setOtherAllowances(BigDecimal otherAllowances) {
		this.otherAllowances = otherAllowances;
	}
	public BigDecimal getEsic() {
		return esic;
	}
	public void setEsic(BigDecimal esic) {
		this.esic = esic;
	}
	public BigDecimal getDeductions() {
		return deductions;
	}
	public void setDeductions(BigDecimal deductions) {
		this.deductions = deductions;
	}
	public BigDecimal getPfEmployeeContribution() {
		return pfEmployeeContribution;
	}
	public void setPfEmployeeContribution(BigDecimal pfEmployeeContribution) {
		this.pfEmployeeContribution = pfEmployeeContribution;
	}
	public BigDecimal getProfessionalTax() {
		return professionalTax;
	}
	public void setProfessionalTax(BigDecimal professionalTax) {
		this.professionalTax = professionalTax;
	}
	public BigDecimal getTaxDeductions() {
		return taxDeductions;
	}
	public void setTaxDeductions(BigDecimal taxDeductions) {
		this.taxDeductions = taxDeductions;
	}
	public BigDecimal getOtherDeductions() {
		return otherDeductions;
	}
	public void setOtherDeductions(BigDecimal otherDeductions) {
		this.otherDeductions = otherDeductions;
	}
	public BigDecimal getNetSalary() {
		return netSalary;
	}
	public void setNetSalary(BigDecimal netSalary) {
		this.netSalary = netSalary;
	}
	public Boolean getEsiApplicable() {
		return esiApplicable;
	}
	public void setEsiApplicable(Boolean esiApplicable) {
		this.esiApplicable = esiApplicable;
	}
	public String getEsiNumber() {
		return esiNumber;
	}
	public void setEsiNumber(String esiNumber) {
		this.esiNumber = esiNumber;
	}
	public String getEsiDispensary() {
		return esiDispensary;
	}
	public void setEsiDispensary(String esiDispensary) {
		this.esiDispensary = esiDispensary;
	}
	public Boolean getPfApplicable() {
		return pfApplicable;
	}
	public void setPfApplicable(Boolean pfApplicable) {
		this.pfApplicable = pfApplicable;
	}
	public String getPfNumber() {
		return pfNumber;
	}
	public void setPfNumber(String pfNumber) {
		this.pfNumber = pfNumber;
	}
	public String getUanNumber() {
		return uanNumber;
	}
	public void setUanNumber(String uanNumber) {
		this.uanNumber = uanNumber;
	}
	public Boolean getRejoin() {
		return rejoin;
	}
	public void setRejoin(Boolean rejoin) {
		this.rejoin = rejoin;
	}
	public String getPreviousEmployeeId() {
		return previousEmployeeId;
	}
	public void setPreviousEmployeeId(String previousEmployeeId) {
		this.previousEmployeeId = previousEmployeeId;
	}
	public String getRemark() {
		return remark;
	}
	public void setRemark(String remark) {
		this.remark = remark;
	}
	
}
