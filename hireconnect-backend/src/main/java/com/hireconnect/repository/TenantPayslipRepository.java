package com.hireconnect.repository;

import com.hireconnect.entity.TenantPayslip;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.Optional;

public interface TenantPayslipRepository extends JpaRepository<TenantPayslip, Long> {

    Optional<TenantPayslip> findByTenantCodeAndEmployeeUserIdAndPeriodStartAndPeriodEnd(
            String tenantCode,
            Long employeeUserId,
            LocalDate periodStart,
            LocalDate periodEnd
    );
}