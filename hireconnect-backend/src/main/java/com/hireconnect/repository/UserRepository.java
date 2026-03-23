package com.hireconnect.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.hireconnect.entity.User;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    // ========== EXISTING METHODS ==========
    Optional<User> findByEmail(String email);
    Optional<User> findByEmailIgnoreCase(String email);
    List<User> findAllById(Iterable<Long> ids);
    Optional<User> findByEmailAndDeletedAtIsNull(String email);
    Optional<User> findByEmailIgnoreCaseAndDeletedAtIsNull(String email);
    Optional<User> findByIdAndDeletedAtIsNull(Long id);
    
    // ========== TENANT-AWARE QUERIES - NEW ==========
    
    /**
     * Find all users by tenant code (company-specific employees)
     */
    List<User> findByTenantCode(String tenantCode);
    
    /**
     * Find all active users by tenant code (excluding deleted)
     */
    List<User> findByTenantCodeAndDeletedAtIsNull(String tenantCode);
    
    /**
     * Find user by email and tenant code (ensures user belongs to correct company)
     */
    Optional<User> findByEmailAndTenantCode(String email, String tenantCode);
    
    /**
     * Find employees only (excluding admins) for a specific tenant
     */
    @Query("SELECT u FROM User u WHERE u.tenantCode = :tenantCode AND u.role = 'EMPLOYEE' AND u.deletedAt IS NULL")
    List<User> findEmployeesByTenantCode(@Param("tenantCode") String tenantCode);
    
    /**
     * Count employees for a specific tenant
     */
    @Query("SELECT COUNT(u) FROM User u WHERE u.tenantCode = :tenantCode AND u.role = 'EMPLOYEE' AND u.deletedAt IS NULL")
    long countEmployeesByTenantCode(@Param("tenantCode") String tenantCode);
    
    /**
     * Check if employee ID is unique within a tenant
     */
    boolean existsByEmployeeIdAndTenantCode(String employeeId, String tenantCode);

    Optional<User> findByEmployeeIdAndCompanyIdAndDeletedAtIsNull(String employeeId, Long companyId);
    
    /**
     * Check if email is unique within a tenant
     */
    boolean existsByEmailAndTenantCode(String email, String tenantCode);
    
    /**
     * Search users within a specific tenant
     */
    @Query("SELECT u FROM User u WHERE u.tenantCode = :tenantCode AND u.deletedAt IS NULL AND " +
           "(LOWER(u.fullName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(u.mobile) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(u.employeeId) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<User> searchUsersByTenantCode(@Param("tenantCode") String tenantCode, @Param("query") String query);
    
    /**
     * Find users by department within a tenant
     */
    @Query("SELECT u FROM User u WHERE u.tenantCode = :tenantCode AND u.department = :department AND u.deletedAt IS NULL")
    List<User> findByTenantCodeAndDepartment(@Param("tenantCode") String tenantCode, @Param("department") String department);
    
    /**
     * Find users by status within a tenant
     */
    @Query("SELECT u FROM User u WHERE u.tenantCode = :tenantCode AND u.status = :status AND u.deletedAt IS NULL")
    List<User> findByTenantCodeAndStatus(@Param("tenantCode") String tenantCode, @Param("status") User.Status status);
    
    /**
     * Find users by role within a tenant
     */
    @Query("SELECT u FROM User u WHERE u.tenantCode = :tenantCode AND u.role = :role AND u.deletedAt IS NULL")
    List<User> findByTenantCodeAndRole(@Param("tenantCode") String tenantCode, @Param("role") User.Role role);
    
    // ========== EXISTING ROLE-BASED QUERIES ==========
    List<User> findByRole(User.Role role);
    List<User> findByRoleAndDeletedAtIsNull(User.Role role);
    List<User> findByRoleAndStatus(User.Role role, User.Status status);
    List<User> findByRoleAndStatusAndDeletedAtIsNull(User.Role role, User.Status status);
    
    // ========== EXISTING STATUS QUERIES ==========
    List<User> findByStatus(User.Status status);
    List<User> findByStatusAndDeletedAtIsNull(User.Status status);
    
    // ========== EXISTING APPROVAL QUERIES ==========
    List<User> findByApproved(Boolean approved);
    List<User> findByApprovedAndDeletedAtIsNull(Boolean approved);
    List<User> findByApprovedAndRole(Boolean approved, User.Role role);
    
    // ========== EXISTING ONBOARDING QUERIES ==========
    List<User> findByOnboardingStatus(User.OnboardingStatus status);
    List<User> findByOnboardingStatusAndRole(User.OnboardingStatus status, User.Role role);
    
    // ========== EXISTING DEPARTMENT QUERIES ==========
    List<User> findByDepartment(String department);
    List<User> findByDepartmentAndDeletedAtIsNull(String department);
    
    // ========== EXISTING ADMIN QUERIES ==========
    List<User> findByIsAdmin(Boolean isAdmin);
    List<User> findByIsAdminAndDeletedAtIsNull(Boolean isAdmin);
    
    // ========== EXISTING COUNT QUERIES ==========
    @Query("SELECT COUNT(u) FROM User u WHERE u.role = :role")
    long countByRole(@Param("role") User.Role role);
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.role = :role AND u.status = :status")
    long countByRoleAndStatus(@Param("role") User.Role role, @Param("status") User.Status status);
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.role = :role AND u.deletedAt IS NULL")
    long countActiveByRole(@Param("role") User.Role role);
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.approved = :approved AND u.role = :role")
    long countByApprovedAndRole(@Param("approved") Boolean approved, @Param("role") User.Role role);
    
    // ========== EXISTING EXISTENCE CHECKS ==========
    boolean existsByEmail(String email);
    boolean existsByEmailAndIdNot(String email, Long id);
    
    // ========== EXISTING SEARCH QUERIES ==========
    @Query("SELECT u FROM User u WHERE u.deletedAt IS NULL AND " +
           "(LOWER(u.fullName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(u.mobile) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<User> searchUsers(@Param("query") String query);
    
    @Query("SELECT u FROM User u WHERE u.role = :role AND u.deletedAt IS NULL AND " +
           "(LOWER(u.fullName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<User> searchUsersByRole(@Param("role") User.Role role, @Param("query") String query);
    
    // ========== EXISTING LOGIN QUERIES ==========
    @Query("SELECT u FROM User u WHERE u.lastLoginAt >= :since AND u.deletedAt IS NULL ORDER BY u.lastLoginAt DESC")
    List<User> findRecentlyLoggedIn(@Param("since") LocalDateTime since);
    
    // ========== EXISTING TOKEN QUERIES ==========
    Optional<User> findByVerificationToken(String token);
    Optional<User> findByResetPasswordToken(String token);
    Optional<User> findByResetPasswordTokenAndResetPasswordExpireAfter(String token, LocalDateTime now);
    
    // ========== EXISTING ADMIN QUERIES ==========
    @Query("SELECT u FROM User u WHERE u.deletedAt IS NULL ORDER BY u.createdAt DESC")
    List<User> findAllActive();
    
    @Query("SELECT u FROM User u WHERE u.deletedAt IS NOT NULL ORDER BY u.deletedAt DESC")
    List<User> findAllDeleted();
    
    @Query("SELECT u FROM User u WHERE u.role = :role OR u.isAdmin = true")
    List<User> findAllAdmins(@Param("role") User.Role role);
    
    @Query("SELECT u FROM User u WHERE u.tenantCode = :tenantCode AND u.companyId = :companyId AND u.role = 'EMPLOYEE' AND u.deletedAt IS NULL")
    List<User> findEmployeesByTenantCompany(@Param("tenantCode") String tenantCode, @Param("companyId") Long companyId);

    @Query("SELECT COUNT(u) FROM User u WHERE u.tenantCode = :tenantCode AND u.companyId = :companyId AND u.role = 'EMPLOYEE' AND u.deletedAt IS NULL")
    long countEmployeesByTenantCompany(@Param("tenantCode") String tenantCode, @Param("companyId") Long companyId);
    
    @Query("""
    		SELECT u FROM User u
    		WHERE u.deletedAt IS NULL
    		  AND u.tenantCode = :tenantCode
    		  AND u.companyId = :companyId
    		  AND (u.isAdmin = true OR u.role = 'ADMIN')
    		""")
    		List<User> findAdminsByTenantCompany(
    		        @Param("tenantCode") String tenantCode,
    		        @Param("companyId") Long companyId
    		);



    @Query("""
    		SELECT u FROM User u
    		WHERE u.deletedAt IS NULL
    		  AND u.tenantCode = :tenantCode
    		  AND u.companyId = :companyId
    		  AND (u.isAdmin = true OR u.role = 'ADMIN')
    		  AND u.email = :email
    		""")
    		Optional<User> findAdminByTenantCompanyAndEmail(
    		        @Param("tenantCode") String tenantCode,
    		        @Param("companyId") Long companyId,
    		        @Param("email") String email
    		);

    @Query("""
            SELECT u FROM User u
            WHERE u.deletedAt IS NULL
              AND u.tenantCode = :tenantCode
              AND u.companyId = :companyId
              AND u.role = 'TEAM_LEAD'
            """)
    List<User> findTeamLeadsByTenantCompany(
            @Param("tenantCode") String tenantCode,
            @Param("companyId") Long companyId
    );

    @Query("""
            SELECT u FROM User u
            WHERE u.deletedAt IS NULL
              AND u.tenantCode = :tenantCode
              AND u.companyId = :companyId
              AND u.role = 'TEAM_LEAD'
              AND u.email = :email
            """)
    Optional<User> findTeamLeadByTenantCompanyAndEmail(
            @Param("tenantCode") String tenantCode,
            @Param("companyId") Long companyId,
            @Param("email") String email
    );




}
