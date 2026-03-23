package com.hireconnect.repository;

import com.hireconnect.entity.GrossSalaryDetails;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GrossSalaryDetailsRepository extends JpaRepository<GrossSalaryDetails, Long> {
    Optional<GrossSalaryDetails> findByEmployeeIdAndTenantCode(String employeeId, String tenantCode);
    Optional<GrossSalaryDetails> findByUserId(Long userId);
    boolean existsByEmployeeIdAndTenantCode(String employeeId, String tenantCode);
    boolean existsByUserId(Long userId);
    void deleteByUserId(Long userId);
    List<GrossSalaryDetails> findByTenantCode(String tenantCode);
}