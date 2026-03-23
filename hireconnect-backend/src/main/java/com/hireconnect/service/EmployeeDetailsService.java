package com.hireconnect.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hireconnect.dto.request.EmployeeDetailsDto;
import com.hireconnect.entity.EmployeeDetails;
import com.hireconnect.repository.EmployeeDetailsRepository;

@Service
public class EmployeeDetailsService {

    @Autowired
    private EmployeeDetailsRepository repository;

    @Autowired
    private UserService userService;

    public EmployeeDetailsDto create(EmployeeDetailsDto dto) {
        validatePasswords(dto);

        if (repository.existsByEmployeeIdAndTenantCode(dto.getEmployeeId(), dto.getTenantCode())) {
            throw new RuntimeException("Employee ID already exists in this tenant");
        }
        if (repository.existsByOfficialEmailAndTenantCode(dto.getOfficialEmail(), dto.getTenantCode())) {
            throw new RuntimeException("Official email already exists in this tenant");
        }

        EmployeeDetails saved = repository.save(toEntity(dto, new EmployeeDetails()));
        return toDto(saved);
    }

    public EmployeeDetailsDto update(String tenantCode, String employeeId, EmployeeDetailsDto dto) {
        validatePasswords(dto);

        EmployeeDetails existing = repository.findByEmployeeIdAndTenantCode(employeeId, tenantCode)
                .orElseThrow(() -> new RuntimeException("Employee details not found"));

        if (dto.getOfficialEmail() != null
                && !existing.getOfficialEmail().equalsIgnoreCase(dto.getOfficialEmail())
                && repository.existsByOfficialEmailAndTenantCode(dto.getOfficialEmail(), tenantCode)) {
            throw new RuntimeException("Official email already exists in this tenant");
        }

        dto.setTenantCode(tenantCode);
        dto.setEmployeeId(employeeId);

        EmployeeDetails updated = repository.save(toEntity(dto, existing));
        return toDto(updated);
    }

    public EmployeeDetailsDto getOne(String tenantCode, String employeeId) {
        return repository.findByEmployeeIdAndTenantCode(employeeId, tenantCode)
                .map(this::toDto)
                .orElseThrow(() -> new RuntimeException("Employee details not found"));
    }

    public List<EmployeeDetailsDto> getByTenant(String tenantCode) {
        return repository.findByTenantCode(tenantCode).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void delete(String tenantCode, String employeeId) {
        EmployeeDetails existing = repository.findByEmployeeIdAndTenantCode(employeeId, tenantCode)
                .orElseThrow(() -> new RuntimeException("Employee details not found"));

        if (existing.getUser() == null || existing.getUser().getId() == null) {
            throw new RuntimeException("Employee user mapping not found");
        }

        userService.hardDeleteEmployee(existing.getUser().getId());
    }

    private void validatePasswords(EmployeeDetailsDto dto) {
        if (dto.getOfficialPassword() == null || dto.getConfirmOfficialPassword() == null) {
            throw new RuntimeException("Official password and confirm password are required");
        }
        if (!dto.getOfficialPassword().equals(dto.getConfirmOfficialPassword())) {
            throw new RuntimeException("Official password and confirm password do not match");
        }
    }

    private EmployeeDetails toEntity(EmployeeDetailsDto dto, EmployeeDetails e) {
        e.setTenantCode(dto.getTenantCode());
        e.setCompanyId(dto.getCompanyId());
        e.setCompanyName(dto.getCompanyName());

        e.setEmployeeId(dto.getEmployeeId());
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

        // ✅ THIS FIELD LINKS EMPLOYEE → TEAM LEAD employeeId
        e.setTeamLeader(dto.getTeamLeader());

        e.setProjectManagerEngineeringManager(dto.getProjectManagerEngineeringManager());
        e.setDirectorCEO(dto.getDirectorCEO());
        return e;
    }

    private EmployeeDetailsDto toDto(EmployeeDetails e) {
        EmployeeDetailsDto dto = new EmployeeDetailsDto();
        dto.setId(e.getId());
        dto.setTenantCode(e.getTenantCode());
        dto.setCompanyId(e.getCompanyId());
        dto.setCompanyName(e.getCompanyName());

        dto.setEmployeeId(e.getEmployeeId());
        dto.setOfficialEmail(e.getOfficialEmail());

        dto.setDateOfJoining(e.getDateOfJoining());
        dto.setEmploymentType(e.getEmploymentType());
        dto.setWorkType(e.getWorkType());
        dto.setShiftType(e.getShiftType());
        dto.setRole(e.getRole());
        dto.setWorkLocation(e.getWorkLocation());
        dto.setStatus(e.getStatus());
        dto.setExperience(e.getExperience());

        dto.setDepartment(e.getDepartment());
        dto.setDesignation(e.getDesignation());
        dto.setReportingManager(e.getReportingManager());
        dto.setTeamLeader(e.getTeamLeader());

        dto.setProjectManagerEngineeringManager(e.getProjectManagerEngineeringManager());
        dto.setDirectorCEO(e.getDirectorCEO());
        return dto;
    }

    // ✅ For dropdown: Team Leads list (designation = "Team Lead")
    public List<EmployeeDetailsDto> getByTenantAndDesignation(String tenantCode, String designation) {
        return repository.findByTenantCodeAndDesignation(tenantCode.trim(), designation.trim())
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    // ✅ MAIN METHOD: Team members under a Team Lead
    public List<EmployeeDetailsDto> getTeamMembersByTeamLead(String tenantCode, String teamLeadEmployeeId) {
        return repository.findByTenantCodeAndTeamLeader(tenantCode.trim(), teamLeadEmployeeId.trim())
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }
}