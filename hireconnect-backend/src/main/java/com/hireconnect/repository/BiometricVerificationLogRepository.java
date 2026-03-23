package com.hireconnect.repository;

import com.hireconnect.entity.BiometricVerificationLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BiometricVerificationLogRepository extends JpaRepository<BiometricVerificationLog, Long> {

    List<BiometricVerificationLog> findTop20ByCompanyIdOrderByCreatedAtDesc(Long companyId);

    Optional<BiometricVerificationLog> findTopByCompanyIdOrderByCreatedAtDesc(Long companyId);

    long countByCompanyId(Long companyId);

    long countByCompanyIdAndVerifiedTrue(Long companyId);

    long countByCompanyIdAndVerifiedFalse(Long companyId);

    long countByCompanyIdAndAttendanceActivatedTrue(Long companyId);
}
