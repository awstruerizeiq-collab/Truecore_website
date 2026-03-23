package com.hireconnect.repository;

import com.hireconnect.entity.TeamLeadTask;
import org.springframework.data.jpa.repository.JpaRepository;



import java.util.List;
import java.util.Optional;

public interface TeamLeadTaskRepository extends JpaRepository<TeamLeadTask, Long> {
    List<TeamLeadTask> findByTenantCodeAndCompanyIdOrderByCreatedAtDesc(String tenantCode, Long companyId);
    Optional<TeamLeadTask> findByIdAndTenantCodeAndCompanyId(Long id, String tenantCode, Long companyId);
}