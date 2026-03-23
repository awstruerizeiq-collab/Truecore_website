package com.hireconnect.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.hireconnect.entity.HolidayAttachment;

@Repository
public interface HolidayAttachmentRepository extends JpaRepository<HolidayAttachment, Long> {

    List<HolidayAttachment> findByTenantCodeAndCompanyIdOrderByUploadedAtDesc(String tenantCode, Long companyId);

    Optional<HolidayAttachment> findByIdAndTenantCodeAndCompanyId(Long id, String tenantCode, Long companyId);
}
