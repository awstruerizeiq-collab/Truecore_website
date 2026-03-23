package com.hireconnect.repository;

import com.hireconnect.entity.AccountDetails;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AccountDetailsRepository extends JpaRepository<AccountDetails, Long> {
    Optional<AccountDetails> findByEmployeeIdAndTenantCode(String employeeId, String tenantCode);
    Optional<AccountDetails> findByUserId(Long userId);
    boolean existsByEmployeeIdAndTenantCode(String employeeId, String tenantCode);
    boolean existsByUserId(Long userId);
    void deleteByUserId(Long userId);
    List<AccountDetails> findByTenantCode(String tenantCode);
}