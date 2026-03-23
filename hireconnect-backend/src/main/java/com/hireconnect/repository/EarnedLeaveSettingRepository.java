package com.hireconnect.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.hireconnect.entity.EarnedLeaveSetting;

@Repository
public interface EarnedLeaveSettingRepository extends JpaRepository<EarnedLeaveSetting, Long> {

    List<EarnedLeaveSetting> findByTenantCodeAndCompanyIdAndYearOrderByMonthAsc(
            String tenantCode,
            Long companyId,
            Integer year
    );

    Optional<EarnedLeaveSetting> findByTenantCodeAndCompanyIdAndYearAndMonth(
            String tenantCode,
            Long companyId,
            Integer year,
            Integer month
    );
}
