package com.hireconnect.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.hireconnect.entity.PerformanceData;

@Repository
public interface PerformanceRepository extends JpaRepository<PerformanceData, Long> {

    // All (admin) — without tenant filtering
    @Query("SELECT DISTINCT p FROM PerformanceData p LEFT JOIN FETCH p.feedback LEFT JOIN FETCH p.user")
    List<PerformanceData> findAllWithFeedback();

    // ✅ Tenant All (used for dashboard)
    @Query("SELECT DISTINCT p FROM PerformanceData p LEFT JOIN FETCH p.feedback LEFT JOIN FETCH p.user " +
           "WHERE p.tenantCode = :tenantCode")
    List<PerformanceData> findAllByTenantCodeWithFeedback(@Param("tenantCode") String tenantCode);

    @Query("SELECT DISTINCT p FROM PerformanceData p LEFT JOIN FETCH p.feedback LEFT JOIN FETCH p.user " +
           "WHERE p.tenantCode = :tenantCode AND p.user.id IN :userIds")
    List<PerformanceData> findByTenantCodeAndUserIdsWithFeedback(
            @Param("tenantCode") String tenantCode,
            @Param("userIds") List<Long> userIds
    );

    @Query("SELECT p FROM PerformanceData p LEFT JOIN FETCH p.feedback LEFT JOIN FETCH p.user WHERE p.employeeId = :employeeId")
    Optional<PerformanceData> findByEmployeeIdWithFeedback(@Param("employeeId") String employeeId);

    @Query("SELECT p FROM PerformanceData p LEFT JOIN FETCH p.feedback LEFT JOIN FETCH p.user WHERE p.user.id = :userId")
    Optional<PerformanceData> findByUserIdWithFeedback(@Param("userId") Long userId);

    @Query("SELECT p FROM PerformanceData p LEFT JOIN FETCH p.feedback LEFT JOIN FETCH p.user WHERE p.id = :id")
    Optional<PerformanceData> findByIdWithFeedback(@Param("id") Long id);

    Optional<PerformanceData> findByEmployeeId(String employeeId);

    Boolean existsByEmployeeId(String employeeId);

    @Query("SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END FROM PerformanceData p WHERE p.user.id = :userId")
    boolean existsByUserId(@Param("userId") Long userId);

    // ✅ Strong tenant safety (for update/delete/validate)
    @Query("SELECT p FROM PerformanceData p WHERE p.id = :id AND p.tenantCode = :tenantCode")
    Optional<PerformanceData> findByIdAndTenantCode(@Param("id") Long id, @Param("tenantCode") String tenantCode);

    @Query("SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END " +
           "FROM PerformanceData p WHERE p.employeeId = :employeeId AND p.tenantCode = :tenantCode")
    boolean existsByEmployeeIdAndTenantCode(@Param("employeeId") String employeeId, @Param("tenantCode") String tenantCode);

    @Modifying
    @Query("DELETE FROM PerformanceData p WHERE p.user.id = :userId")
    void deleteByUserId(@Param("userId") Long userId);
}