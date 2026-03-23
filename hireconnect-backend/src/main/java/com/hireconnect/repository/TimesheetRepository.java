package com.hireconnect.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.hireconnect.entity.Timesheet;

@Repository
public interface TimesheetRepository extends JpaRepository<Timesheet, Long> {
    
//    List<Timesheet> findByEmployeeIdOrderByCreatedAtDesc(Long employeeId);
//    
//    List<Timesheet> findTop500ByOrderByCreatedAtDesc();
    List<Timesheet> findByEmployeeIdOrderByCreatedAtDesc(Long employeeId);
    
    List<Timesheet> findTop500ByOrderByCreatedAtDesc();
    
    Optional<Timesheet> findBySessionId(Long sessionId);
    
    @Query("""
    	    SELECT t FROM Timesheet t
    	    WHERE t.employeeId IN (
    	        SELECT u.id FROM User u
    	        WHERE u.role='EMPLOYEE'
    	        AND u.tenantCode = :tenantCode
    	        AND u.companyId = :companyId
    	        AND u.deletedAt IS NULL
    	    )
    	    ORDER BY t.submittedAt DESC
    	""")
    	List<Timesheet> findAllByTenantCompany(
    	        @Param("tenantCode") String tenantCode,
    	        @Param("companyId") Long companyId
    	);

}