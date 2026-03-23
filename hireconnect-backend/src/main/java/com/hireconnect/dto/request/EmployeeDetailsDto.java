package com.hireconnect.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;

@Data
public class EmployeeDetailsDto {

    private Long id;

    private String tenantCode;

    private Long companyId;
    private String companyName;

    private String employeeId;

    @NotBlank
    private String officialEmail;

    @NotBlank
    private String officialPassword;

    @NotBlank
    private String confirmOfficialPassword;

    private LocalDate dateOfJoining;

    @NotBlank
    private String employmentType;

    @NotBlank
    private String workType;

    @NotBlank
    private String shiftType;

    @NotBlank
    private String role;

    @NotBlank
    private String workLocation;

    @NotBlank
    private String status;

    private Integer experience;

    @NotBlank
    private String department;

    @NotBlank
    private String designation;

    @NotBlank
    private String reportingManager;

    private String teamLeader;
    private String projectManagerEngineeringManager;
    private String directorCEO;
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
	public String getOfficialEmail() {
		return officialEmail;
	}
	public void setOfficialEmail(String officialEmail) {
		this.officialEmail = officialEmail == null ? null : officialEmail.trim().toLowerCase();
	}
	public String getOfficialPassword() {
		return officialPassword;
	}
	public void setOfficialPassword(String officialPassword) {
		this.officialPassword = officialPassword;
	}
	public String getConfirmOfficialPassword() {
		return confirmOfficialPassword;
	}
	public void setConfirmOfficialPassword(String confirmOfficialPassword) {
		this.confirmOfficialPassword = confirmOfficialPassword;
	}
	public LocalDate getDateOfJoining() {
		return dateOfJoining;
	}
	public void setDateOfJoining(LocalDate dateOfJoining) {
		this.dateOfJoining = dateOfJoining;
	}
	public String getEmploymentType() {
		return employmentType;
	}
	public void setEmploymentType(String employmentType) {
		this.employmentType = employmentType;
	}
	public String getWorkType() {
		return workType;
	}
	public void setWorkType(String workType) {
		this.workType = workType;
	}
	public String getShiftType() {
		return shiftType;
	}
	public void setShiftType(String shiftType) {
		this.shiftType = shiftType;
	}
	public String getRole() {
		return role;
	}
	public void setRole(String role) {
		this.role = role;
	}
	public String getWorkLocation() {
		return workLocation;
	}
	public void setWorkLocation(String workLocation) {
		this.workLocation = workLocation;
	}
	public String getStatus() {
		return status;
	}
	public void setStatus(String status) {
		this.status = status;
	}
	public Integer getExperience() {
		return experience;
	}
	public void setExperience(Integer experience) {
		this.experience = experience;
	}
	public String getDepartment() {
		return department;
	}
	public void setDepartment(String department) {
		this.department = department;
	}
	public String getDesignation() {
		return designation;
	}
	public void setDesignation(String designation) {
		this.designation = designation;
	}
	public String getReportingManager() {
		return reportingManager;
	}
	public void setReportingManager(String reportingManager) {
		this.reportingManager = reportingManager;
	}
	public String getTeamLeader() {
		return teamLeader;
	}
	public void setTeamLeader(String teamLeader) {
		this.teamLeader = teamLeader;
	}
	public String getProjectManagerEngineeringManager() {
		return projectManagerEngineeringManager;
	}
	public void setProjectManagerEngineeringManager(String projectManagerEngineeringManager) {
		this.projectManagerEngineeringManager = projectManagerEngineeringManager;
	}
	public String getDirectorCEO() {
		return directorCEO;
	}
	public void setDirectorCEO(String directorCEO) {
		this.directorCEO = directorCEO;
	}
    
    
}