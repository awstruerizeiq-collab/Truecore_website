package com.hireconnect.service;

import com.hireconnect.dto.request.GrossSalaryDetailsDto;
import com.hireconnect.entity.GrossSalaryDetails;
import com.hireconnect.repository.GrossSalaryDetailsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class GrossSalaryDetailsService {

    @Autowired
    private GrossSalaryDetailsRepository repository;

    public GrossSalaryDetailsDto create(GrossSalaryDetailsDto dto) {
        validate(dto);

        if (repository.existsByEmployeeIdAndTenantCode(dto.getEmployeeId(), dto.getTenantCode())) {
            throw new RuntimeException("Gross salary details already exist for this employee in this tenant");
        }

        normalizeComputedFields(dto);
        GrossSalaryDetails saved = repository.save(toEntity(dto, new GrossSalaryDetails()));
        return toDto(saved);
    }

    public GrossSalaryDetailsDto update(String tenantCode, String employeeId, GrossSalaryDetailsDto dto) {
        validate(dto);

        GrossSalaryDetails existing = repository.findByEmployeeIdAndTenantCode(employeeId, tenantCode)
            .orElseThrow(() -> new RuntimeException("Gross salary details not found"));

        dto.setTenantCode(tenantCode);
        dto.setEmployeeId(employeeId);

        normalizeComputedFields(dto);
        GrossSalaryDetails updated = repository.save(toEntity(dto, existing));
        return toDto(updated);
    }

    public GrossSalaryDetailsDto getOne(String tenantCode, String employeeId) {
        return repository.findByEmployeeIdAndTenantCode(employeeId, tenantCode)
            .map(this::toDto)
            .orElseThrow(() -> new RuntimeException("Gross salary details not found"));
    }

    public List<GrossSalaryDetailsDto> getByTenant(String tenantCode) {
        return repository.findByTenantCode(tenantCode).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }

    public void delete(String tenantCode, String employeeId) {
        GrossSalaryDetails existing = repository.findByEmployeeIdAndTenantCode(employeeId, tenantCode)
            .orElseThrow(() -> new RuntimeException("Gross salary details not found"));
        repository.delete(existing);
    }

    private void validate(GrossSalaryDetailsDto dto) {
        if (dto.getSalary() == null || dto.getSalary().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Gross salary must be greater than 0");
        }

        if (Boolean.TRUE.equals(dto.getEsiApplicable())) {
            if (isBlank(dto.getEsiNumber()) || isBlank(dto.getEsiDispensary())) {
                throw new RuntimeException("ESI number and dispensary are required when ESI is applicable");
            }
        }

        if (Boolean.TRUE.equals(dto.getPfApplicable())) {
            if (isBlank(dto.getPfNumber()) || isBlank(dto.getUanNumber())) {
                throw new RuntimeException("PF number and UAN number are required when PF is applicable");
            }
        }

        if (Boolean.TRUE.equals(dto.getRejoin()) && isBlank(dto.getPreviousEmployeeId())) {
            throw new RuntimeException("Previous employee ID is required when rejoin is true");
        }
    }

    private void normalizeComputedFields(GrossSalaryDetailsDto dto) {
        BigDecimal deductions = nz(dto.getPfEmployeeContribution())
            .add(nz(dto.getProfessionalTax()))
            .add(nz(dto.getEsic()))
            .add(nz(dto.getMedicalInsurance()))
            .add(nz(dto.getTaxDeductions()))
            .add(nz(dto.getOtherDeductions()))
            .setScale(2, RoundingMode.HALF_UP);

        dto.setDeductions(deductions);

        BigDecimal netSalary = nz(dto.getSalary()).subtract(deductions).setScale(2, RoundingMode.HALF_UP);
        dto.setNetSalary(netSalary);
    }

    private BigDecimal nz(BigDecimal v) {
        return v == null ? BigDecimal.ZERO : v;
    }

    private boolean isBlank(String v) {
        return v == null || v.trim().isEmpty();
    }

    private GrossSalaryDetails toEntity(GrossSalaryDetailsDto dto, GrossSalaryDetails e) {
        e.setTenantCode(dto.getTenantCode());
        e.setCompanyId(dto.getCompanyId());
        e.setCompanyName(dto.getCompanyName());
        e.setEmployeeId(dto.getEmployeeId());
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

    private GrossSalaryDetailsDto toDto(GrossSalaryDetails e) {
        GrossSalaryDetailsDto dto = new GrossSalaryDetailsDto();
        dto.setId(e.getId());
        dto.setTenantCode(e.getTenantCode());
        dto.setCompanyId(e.getCompanyId());
        dto.setCompanyName(e.getCompanyName());
        dto.setEmployeeId(e.getEmployeeId());
        dto.setSalary(e.getSalary());
        dto.setCompanyJoinDate(e.getCompanyJoinDate());
        dto.setBasicSalary(e.getBasicSalary());
        dto.setHra(e.getHra());
        dto.setConveyanceAllowance(e.getConveyanceAllowance());
        dto.setMedicalAllowance(e.getMedicalAllowance());
        dto.setMedicalInsurance(e.getMedicalInsurance());
        dto.setLta(e.getLta());
        dto.setSpecialAllowance(e.getSpecialAllowance());
        dto.setOtherAllowances(e.getOtherAllowances());
        dto.setEsic(e.getEsic());
        dto.setDeductions(e.getDeductions());
        dto.setPfEmployeeContribution(e.getPfEmployeeContribution());
        dto.setProfessionalTax(e.getProfessionalTax());
        dto.setTaxDeductions(e.getTaxDeductions());
        dto.setOtherDeductions(e.getOtherDeductions());
        dto.setNetSalary(e.getNetSalary());
        dto.setEsiApplicable(e.getEsiApplicable());
        dto.setEsiNumber(e.getEsiNumber());
        dto.setEsiDispensary(e.getEsiDispensary());
        dto.setPfApplicable(e.getPfApplicable());
        dto.setPfNumber(e.getPfNumber());
        dto.setUanNumber(e.getUanNumber());
        dto.setRejoin(e.getRejoin());
        dto.setPreviousEmployeeId(e.getPreviousEmployeeId());
        dto.setRemark(e.getRemark());
        return dto;
    }
}