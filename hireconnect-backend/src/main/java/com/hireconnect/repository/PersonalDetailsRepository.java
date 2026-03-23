package com.hireconnect.repository;

import com.hireconnect.entity.PersonalDetails;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PersonalDetailsRepository extends JpaRepository<PersonalDetails, Long> {
    Optional<PersonalDetails> findByEmployeeIdAndTenantCode(String employeeId, String tenantCode);
    Optional<PersonalDetails> findByUserId(Long userId);
    boolean existsByEmployeeIdAndTenantCode(String employeeId, String tenantCode);
    boolean existsByUserId(Long userId);
    void deleteByUserId(Long userId);
    List<PersonalDetails> findByTenantCode(String tenantCode);
}