package com.hireconnect.service;

import com.hireconnect.dto.request.PersonalDetailsDto;
import com.hireconnect.entity.PersonalDetails;
import com.hireconnect.repository.PersonalDetailsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PersonalDetailsService {

    @Autowired
    private PersonalDetailsRepository repository;

    public PersonalDetailsDto create(PersonalDetailsDto dto) {
        if (repository.existsByEmployeeIdAndTenantCode(dto.getEmployeeId(), dto.getTenantCode())) {
            throw new RuntimeException("Personal details already exist for this employee in this tenant");
        }
        PersonalDetails saved = repository.save(toEntity(dto, new PersonalDetails()));
        return toDto(saved);
    }

    public PersonalDetailsDto update(String tenantCode, String employeeId, PersonalDetailsDto dto) {
        PersonalDetails existing = repository.findByEmployeeIdAndTenantCode(employeeId, tenantCode)
            .orElseThrow(() -> new RuntimeException("Personal details not found"));
        PersonalDetails updated = repository.save(toEntity(dto, existing));
        return toDto(updated);
    }

    public PersonalDetailsDto getOne(String tenantCode, String employeeId) {
        return repository.findByEmployeeIdAndTenantCode(employeeId, tenantCode)
            .map(this::toDto)
            .orElseThrow(() -> new RuntimeException("Personal details not found"));
    }

    public List<PersonalDetailsDto> getByTenant(String tenantCode) {
        return repository.findByTenantCode(tenantCode)
            .stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }

    public void delete(String tenantCode, String employeeId) {
        PersonalDetails existing = repository.findByEmployeeIdAndTenantCode(employeeId, tenantCode)
            .orElseThrow(() -> new RuntimeException("Personal details not found"));
        repository.delete(existing);
    }

    private PersonalDetails toEntity(PersonalDetailsDto dto, PersonalDetails entity) {
        entity.setTenantCode(dto.getTenantCode());
        entity.setEmployeeId(dto.getEmployeeId());
        entity.setFirstName(dto.getFirstName());
        entity.setMiddleName(dto.getMiddleName());
        entity.setLastName(dto.getLastName());
        entity.setGender(dto.getGender());
        entity.setDob(dto.getDob());
        entity.setPersonalPhone(dto.getPersonalPhone());
        entity.setFatherName(dto.getFatherName());
        entity.setMotherName(dto.getMotherName());
        entity.setEmergencyContactName(dto.getEmergencyContactName());
        entity.setEmergencyContactNumber(dto.getEmergencyContactNumber());
        entity.setPersonalEmail(dto.getPersonalEmail());
        entity.setFlatNo(dto.getFlatNo());
        entity.setArea(dto.getArea());
        entity.setLandmark(dto.getLandmark());
        entity.setCity(dto.getCity());
        entity.setState(dto.getState());
        entity.setPincode(dto.getPincode());
        entity.setPermanentFlatNo(dto.getPermanentFlatNo());
        entity.setPermanentArea(dto.getPermanentArea());
        entity.setPermanentLandmark(dto.getPermanentLandmark());
        entity.setPermanentCity(dto.getPermanentCity());
        entity.setPermanentState(dto.getPermanentState());
        entity.setPermanentPincode(dto.getPermanentPincode());
        entity.setAadhaar(dto.getAadhaar());
        entity.setPan(dto.getPan());
        entity.setBloodGroup(dto.getBloodGroup());
        entity.setMaritalStatus(dto.getMaritalStatus());
        entity.setWifeName(dto.getWifeName());
        return entity;
    }

    private PersonalDetailsDto toDto(PersonalDetails e) {
        PersonalDetailsDto dto = new PersonalDetailsDto();
        dto.setId(e.getId());
        dto.setTenantCode(e.getTenantCode());
        dto.setEmployeeId(e.getEmployeeId());
        dto.setFirstName(e.getFirstName());
        dto.setMiddleName(e.getMiddleName());
        dto.setLastName(e.getLastName());
        dto.setGender(e.getGender());
        dto.setDob(e.getDob());
        dto.setPersonalPhone(e.getPersonalPhone());
        dto.setFatherName(e.getFatherName());
        dto.setMotherName(e.getMotherName());
        dto.setEmergencyContactName(e.getEmergencyContactName());
        dto.setEmergencyContactNumber(e.getEmergencyContactNumber());
        dto.setPersonalEmail(e.getPersonalEmail());
        dto.setFlatNo(e.getFlatNo());
        dto.setArea(e.getArea());
        dto.setLandmark(e.getLandmark());
        dto.setCity(e.getCity());
        dto.setState(e.getState());
        dto.setPincode(e.getPincode());
        dto.setPermanentFlatNo(e.getPermanentFlatNo());
        dto.setPermanentArea(e.getPermanentArea());
        dto.setPermanentLandmark(e.getPermanentLandmark());
        dto.setPermanentCity(e.getPermanentCity());
        dto.setPermanentState(e.getPermanentState());
        dto.setPermanentPincode(e.getPermanentPincode());
        dto.setAadhaar(e.getAadhaar());
        dto.setPan(e.getPan());
        dto.setBloodGroup(e.getBloodGroup());
        dto.setMaritalStatus(e.getMaritalStatus());
        dto.setWifeName(e.getWifeName());
        return dto;
    }
}