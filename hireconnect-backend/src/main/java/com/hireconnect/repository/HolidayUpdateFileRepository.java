package com.hireconnect.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.hireconnect.entity.HolidayUpdateFile;


public interface HolidayUpdateFileRepository extends JpaRepository<HolidayUpdateFile, Long> {

    List<HolidayUpdateFile> findByTenantCodeAndCompanyIdOrderByUploadedAtDesc(String tenantCode, Long companyId);

    Optional<HolidayUpdateFile> findByIdAndTenantCodeAndCompanyId(Long id, String tenantCode, Long companyId);
}
