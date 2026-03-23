package com.hireconnect.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.hireconnect.entity.AdminPolicy;

public interface AdminPolicyRepository extends JpaRepository<AdminPolicy, Long> {
    
    // Find policies by exact tenant code match
    @Query("SELECT p FROM AdminPolicy p WHERE TRIM(p.tenantCode) = TRIM(:tenantCode)")
    List<AdminPolicy> findByTenantCode(@Param("tenantCode") String tenantCode);

    Optional<AdminPolicy> findByTenantCodeAndAttachmentPath(String tenantCode, String attachmentPath);
}
