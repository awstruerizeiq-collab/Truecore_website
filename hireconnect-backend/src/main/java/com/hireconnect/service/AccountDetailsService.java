package com.hireconnect.service;

import com.hireconnect.dto.request.AccountDetailsDto;
import com.hireconnect.entity.AccountDetails;
import com.hireconnect.repository.AccountDetailsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AccountDetailsService {

    @Autowired
    private AccountDetailsRepository repository;

    public AccountDetailsDto create(AccountDetailsDto dto) {
        validate(dto);

        if (repository.existsByEmployeeIdAndTenantCode(dto.getEmployeeId(), dto.getTenantCode())) {
            throw new RuntimeException("Account details already exist for this employee in this tenant");
        }

        AccountDetails saved = repository.save(toEntity(dto, new AccountDetails()));
        return toDto(saved);
    }

    public AccountDetailsDto update(String tenantCode, String employeeId, AccountDetailsDto dto) {
        validate(dto);

        AccountDetails existing = repository.findByEmployeeIdAndTenantCode(employeeId, tenantCode)
            .orElseThrow(() -> new RuntimeException("Account details not found"));

        dto.setTenantCode(tenantCode);
        dto.setEmployeeId(employeeId);

        AccountDetails updated = repository.save(toEntity(dto, existing));
        return toDto(updated);
    }

    public AccountDetailsDto getOne(String tenantCode, String employeeId) {
        return repository.findByEmployeeIdAndTenantCode(employeeId, tenantCode)
            .map(this::toDto)
            .orElseThrow(() -> new RuntimeException("Account details not found"));
    }

    public List<AccountDetailsDto> getByTenant(String tenantCode) {
        return repository.findByTenantCode(tenantCode).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }

    public void delete(String tenantCode, String employeeId) {
        AccountDetails existing = repository.findByEmployeeIdAndTenantCode(employeeId, tenantCode)
            .orElseThrow(() -> new RuntimeException("Account details not found"));
        repository.delete(existing);
    }

    private void validate(AccountDetailsDto dto) {
        if (!dto.getAccountNumber().equals(dto.getReAccountNumber())) {
            throw new RuntimeException("Account numbers do not match");
        }
    }

    private AccountDetails toEntity(AccountDetailsDto dto, AccountDetails e) {
        e.setTenantCode(dto.getTenantCode());
        e.setCompanyId(dto.getCompanyId());
        e.setCompanyName(dto.getCompanyName());
        e.setEmployeeId(dto.getEmployeeId());
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

    private AccountDetailsDto toDto(AccountDetails e) {
        AccountDetailsDto dto = new AccountDetailsDto();
        dto.setId(e.getId());
        dto.setTenantCode(e.getTenantCode());
        dto.setCompanyId(e.getCompanyId());
        dto.setCompanyName(e.getCompanyName());
        dto.setEmployeeId(e.getEmployeeId());
        dto.setBankName(e.getBankName());
        dto.setBranchName(e.getBranchName());
        dto.setAccountHolderName(e.getAccountHolderName());
        dto.setAccountNumber(e.getAccountNumber());
        dto.setAccountType(e.getAccountType());
        dto.setIfscCode(e.getIfscCode());
        dto.setSalaryCreditMethod(e.getSalaryCreditMethod());
        dto.setAccountPhone(e.getAccountPhone());
        return dto;
    }
}