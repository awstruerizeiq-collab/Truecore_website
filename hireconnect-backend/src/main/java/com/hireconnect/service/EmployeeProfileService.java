package com.hireconnect.service;

import com.hireconnect.dto.request.*;
import com.hireconnect.entity.*;
import com.hireconnect.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EmployeeProfileService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private PersonalDetailsRepository personalDetailsRepository;

    @Autowired
    private EmployeeDetailsRepository employeeDetailsRepository;

    @Autowired
    private AccountDetailsRepository accountDetailsRepository;

    @Autowired
    private GrossSalaryDetailsRepository grossSalaryDetailsRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Transactional
    public Long createFullProfile(FullEmployeeProfileRequest request) {
        RegisterRequest userReq = request.getUser();

        if (userReq.getTenantCode() == null || userReq.getTenantCode().trim().isEmpty()) {
            throw new RuntimeException("Tenant code is required");
        }

        Company company = companyRepository.findByTenantCode(userReq.getTenantCode())
                .orElseThrow(() -> new RuntimeException("Invalid tenant code: company not found"));

        if (userRepository.existsByEmail(userReq.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        if (userReq.getEmployeeId() != null
                && userRepository.existsByEmployeeIdAndTenantCode(userReq.getEmployeeId(), userReq.getTenantCode())) {
            throw new RuntimeException("Employee ID already exists in this tenant");
        }

        User user = new User();
        user.setFullName(userReq.getFullName());
        user.setEmail(userReq.getEmail());
        String officialEmail = request.getEmployeeDetails() != null ? request.getEmployeeDetails().getOfficialEmail() : null;
        user.setOfficialEmail(officialEmail != null && !officialEmail.isBlank() ? officialEmail : userReq.getEmail());
        user.setPassword(passwordEncoder.encode(userReq.getPassword()));
        user.setPlainPassword(userReq.getPassword());
        user.setMobile(userReq.getMobile());
        user.setEmployeeId(userReq.getEmployeeId());
        user.setDepartment(userReq.getDepartment());
        user.setPosition(userReq.getPosition());
        user.setDob(userReq.getDob());
        user.setJoiningDate(userReq.getJoiningDate());
        user.setTenantCode(userReq.getTenantCode());
        user.setCompanyId(company.getId());
        user.setCompanyName(company.getDisplayName());
        user.setRole(parseRole(userReq.getRole()));
        user.setStatus(User.Status.ACTIVE);
        user.setOnboardingStatus(User.OnboardingStatus.NOT_STARTED);
        user.setIsAdmin(user.getRole() == User.Role.ADMIN);

        User savedUser = userRepository.save(user);

        PersonalDetails personal = mapPersonal(request.getPersonalDetails(), savedUser);
        personalDetailsRepository.save(personal);

        EmployeeDetails employee = mapEmployee(request.getEmployeeDetails(), savedUser);
        employeeDetailsRepository.save(employee);

        AccountDetails account = mapAccount(request.getAccountDetails(), savedUser);
        accountDetailsRepository.save(account);

        GrossSalaryDetails salary = mapSalary(request.getGrossSalaryDetails(), savedUser);
        grossSalaryDetailsRepository.save(salary);

        return savedUser.getId();
    }

    private User.Role parseRole(String role) {
        if (role == null || role.isBlank()) {
            return User.Role.EMPLOYEE;
        }
        try {
            return User.Role.valueOf(role.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return User.Role.EMPLOYEE;
        }
    }

    private PersonalDetails mapPersonal(PersonalDetailsDto dto, User user) {
        PersonalDetails e = new PersonalDetails();
        e.setUser(user);
        e.setTenantCode(user.getTenantCode());
        e.setEmployeeId(user.getEmployeeId());
        e.setFirstName(dto.getFirstName());
        e.setMiddleName(dto.getMiddleName());
        e.setLastName(dto.getLastName());
        e.setGender(dto.getGender());
        e.setDob(dto.getDob());
        e.setPersonalPhone(dto.getPersonalPhone());
        e.setFatherName(dto.getFatherName());
        e.setMotherName(dto.getMotherName());
        e.setEmergencyContactName(dto.getEmergencyContactName());
        e.setEmergencyContactNumber(dto.getEmergencyContactNumber());
        e.setPersonalEmail(dto.getPersonalEmail());
        e.setFlatNo(dto.getFlatNo());
        e.setArea(dto.getArea());
        e.setLandmark(dto.getLandmark());
        e.setCity(dto.getCity());
        e.setState(dto.getState());
        e.setPincode(dto.getPincode());
        e.setPermanentFlatNo(dto.getPermanentFlatNo());
        e.setPermanentArea(dto.getPermanentArea());
        e.setPermanentLandmark(dto.getPermanentLandmark());
        e.setPermanentCity(dto.getPermanentCity());
        e.setPermanentState(dto.getPermanentState());
        e.setPermanentPincode(dto.getPermanentPincode());
        e.setAadhaar(dto.getAadhaar());
        e.setPan(dto.getPan());
        e.setBloodGroup(dto.getBloodGroup());
        e.setMaritalStatus(dto.getMaritalStatus());
        e.setWifeName(dto.getWifeName());
        return e;
    }

    private EmployeeDetails mapEmployee(EmployeeDetailsDto dto, User user) {
        if (dto.getOfficialPassword() == null || dto.getConfirmOfficialPassword() == null
                || !dto.getOfficialPassword().equals(dto.getConfirmOfficialPassword())) {
            throw new RuntimeException("Official password and confirm official password must match");
        }

        EmployeeDetails e = new EmployeeDetails();
        e.setUser(user);
        e.setTenantCode(user.getTenantCode());
        e.setCompanyId(user.getCompanyId());
        e.setCompanyName(user.getCompanyName());
        e.setEmployeeId(user.getEmployeeId());
        e.setOfficialEmail(dto.getOfficialEmail());
        e.setOfficialPassword(dto.getOfficialPassword());
        e.setDateOfJoining(dto.getDateOfJoining());
        e.setEmploymentType(dto.getEmploymentType());
        e.setWorkType(dto.getWorkType());
        e.setShiftType(dto.getShiftType());
        e.setRole(dto.getRole());
        e.setWorkLocation(dto.getWorkLocation());
        e.setStatus(dto.getStatus());
        e.setExperience(dto.getExperience());
        e.setDepartment(dto.getDepartment());
        e.setDesignation(dto.getDesignation());
        e.setReportingManager(dto.getReportingManager());
        e.setTeamLeader(dto.getTeamLeader());
        e.setProjectManagerEngineeringManager(dto.getProjectManagerEngineeringManager());
        e.setDirectorCEO(dto.getDirectorCEO());
        return e;
    }

    private AccountDetails mapAccount(AccountDetailsDto dto, User user) {
        if (dto.getAccountNumber() == null || dto.getReAccountNumber() == null
                || !dto.getAccountNumber().equals(dto.getReAccountNumber())) {
            throw new RuntimeException("Account number and re-enter account number must match");
        }

        AccountDetails e = new AccountDetails();
        e.setUser(user);
        e.setTenantCode(user.getTenantCode());
        e.setCompanyId(user.getCompanyId());
        e.setCompanyName(user.getCompanyName());
        e.setEmployeeId(user.getEmployeeId());
        e.setBankName(dto.getBankName());
        e.setBranchName(dto.getBranchName());
        e.setAccountHolderName(dto.getAccountHolderName());
        e.setAccountNumber(dto.getAccountNumber());
        e.setAccountType(dto.getAccountType());
        e.setIfscCode(dto.getIfscCode());
        e.setSalaryCreditMethod(dto.getSalaryCreditMethod());
        e.setAccountPhone(dto.getAccountPhone());
        return e;
    }

    private GrossSalaryDetails mapSalary(GrossSalaryDetailsDto dto, User user) {
        GrossSalaryDetails e = new GrossSalaryDetails();
        e.setUser(user);
        e.setTenantCode(user.getTenantCode());
        e.setCompanyId(user.getCompanyId());
        e.setCompanyName(user.getCompanyName());
        e.setEmployeeId(user.getEmployeeId());
        e.setSalary(dto.getSalary());
        e.setCompanyJoinDate(dto.getCompanyJoinDate());
        e.setBasicSalary(dto.getBasicSalary());
        e.setHra(dto.getHra());
        e.setConveyanceAllowance(dto.getConveyanceAllowance());
        e.setMedicalAllowance(dto.getMedicalAllowance());
        e.setMedicalInsurance(dto.getMedicalInsurance());
        e.setLta(dto.getLta());
        e.setSpecialAllowance(dto.getSpecialAllowance());
        e.setOtherAllowances(dto.getOtherAllowances());
        e.setEsic(dto.getEsic());
        e.setDeductions(dto.getDeductions());
        e.setPfEmployeeContribution(dto.getPfEmployeeContribution());
        e.setProfessionalTax(dto.getProfessionalTax());
        e.setTaxDeductions(dto.getTaxDeductions());
        e.setOtherDeductions(dto.getOtherDeductions());
        e.setNetSalary(dto.getNetSalary());
        e.setEsiApplicable(dto.getEsiApplicable());
        e.setEsiNumber(dto.getEsiNumber());
        e.setEsiDispensary(dto.getEsiDispensary());
        e.setPfApplicable(dto.getPfApplicable());
        e.setPfNumber(dto.getPfNumber());
        e.setUanNumber(dto.getUanNumber());
        e.setRejoin(dto.getRejoin());
        e.setPreviousEmployeeId(dto.getPreviousEmployeeId());
        e.setRemark(dto.getRemark());
        return e;
    }
}