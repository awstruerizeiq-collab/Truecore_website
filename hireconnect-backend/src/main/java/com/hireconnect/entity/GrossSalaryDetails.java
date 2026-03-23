package com.hireconnect.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "gross_salary_details",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id"})
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GrossSalaryDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "tenant_code", nullable = false)
    private String tenantCode;

    @Column(name = "company_id")
    private Long companyId;

    @Column(name = "company_name")
    private String companyName;

    @Column(name = "employee_id", nullable = false)
    private String employeeId;

    @Column(name = "salary", precision = 12, scale = 2, nullable = false)
    private BigDecimal salary;

    @Column(name = "company_join_date")
    private LocalDate companyJoinDate;

    @Column(name = "basic_salary", precision = 12, scale = 2)
    private BigDecimal basicSalary;

    @Column(name = "hra", precision = 12, scale = 2)
    private BigDecimal hra;

    @Column(name = "conveyance_allowance", precision = 12, scale = 2)
    private BigDecimal conveyanceAllowance;

    @Column(name = "medical_allowance", precision = 12, scale = 2)
    private BigDecimal medicalAllowance;

    @Column(name = "medical_insurance", precision = 12, scale = 2)
    private BigDecimal medicalInsurance;

    @Column(name = "lta", precision = 12, scale = 2)
    private BigDecimal lta;

    @Column(name = "special_allowance", precision = 12, scale = 2)
    private BigDecimal specialAllowance;

    @Column(name = "other_allowances", precision = 12, scale = 2)
    private BigDecimal otherAllowances;

    @Column(name = "esic", precision = 12, scale = 2)
    private BigDecimal esic;

    @Column(name = "deductions", precision = 12, scale = 2)
    private BigDecimal deductions;

    @Column(name = "pf_employee_contribution", precision = 12, scale = 2)
    private BigDecimal pfEmployeeContribution;

    @Column(name = "professional_tax", precision = 12, scale = 2)
    private BigDecimal professionalTax;

    @Column(name = "tax_deductions", precision = 12, scale = 2)
    private BigDecimal taxDeductions;

    @Column(name = "other_deductions", precision = 12, scale = 2)
    private BigDecimal otherDeductions;

    @Column(name = "net_salary", precision = 12, scale = 2)
    private BigDecimal netSalary;

    @Column(name = "esi_applicable")
    private Boolean esiApplicable;

    @Column(name = "esi_number")
    private String esiNumber;

    @Column(name = "esi_dispensary")
    private String esiDispensary;

    @Column(name = "pf_applicable")
    private Boolean pfApplicable;

    @Column(name = "pf_number")
    private String pfNumber;

    @Column(name = "uan_number")
    private String uanNumber;

    @Column(name = "rejoin")
    private Boolean rejoin;

    @Column(name = "previous_employee_id")
    private String previousEmployeeId;

    @Column(name = "remark", length = 1000)
    private String remark;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    public void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public User getUser() {
		return user;
	}

	public void setUser(User user) {
		this.user = user;
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