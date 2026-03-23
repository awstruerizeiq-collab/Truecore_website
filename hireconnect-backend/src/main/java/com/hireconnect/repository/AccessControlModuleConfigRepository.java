package com.hireconnect.repository;

import com.hireconnect.entity.AccessControlModuleConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AccessControlModuleConfigRepository extends JpaRepository<AccessControlModuleConfig, Long> {

    Optional<AccessControlModuleConfig> findByCompanyIdAndModuleKey(Long companyId, String moduleKey);

    List<AccessControlModuleConfig> findByCompanyIdOrderByModuleKeyAsc(Long companyId);

    Optional<AccessControlModuleConfig> findByApiKeyAndModuleKey(String apiKey, String moduleKey);

    long countByCompanyIdAndEnabledTrue(Long companyId);

    @Query("""
        SELECT COUNT(c) FROM AccessControlModuleConfig c
        WHERE c.companyId = :companyId
          AND c.enabled = true
          AND c.deviceName IS NOT NULL
          AND TRIM(c.deviceName) <> ''
        """)
    long countDevicesConnected(@Param("companyId") Long companyId);
}
