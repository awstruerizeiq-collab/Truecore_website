package com.hireconnect.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.hireconnect.entity.Holiday;

public interface HolidayRepository extends JpaRepository<Holiday, Long> {

    List<Holiday> findByTenantCodeAndCompanyIdOrderByDateAsc(String tenantCode, Long companyId);

    List<Holiday> findByTenantCodeAndCompanyIdAndDateBetweenOrderByDateAsc(
        String tenantCode,
        Long companyId,
        LocalDate startDate,
        LocalDate endDate
    );

    Optional<Holiday> findByIdAndTenantCodeAndCompanyId(Long id, String tenantCode, Long companyId);

    boolean existsByTenantCodeAndCompanyIdAndNameIgnoreCaseAndDate(
        String tenantCode,
        Long companyId,
        String name,
        LocalDate date
    );
}
