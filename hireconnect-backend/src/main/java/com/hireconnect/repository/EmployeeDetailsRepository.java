package com.hireconnect.repository;

import com.hireconnect.entity.EmployeeDetails;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeDetailsRepository extends JpaRepository<EmployeeDetails, Long> {
    Optional<EmployeeDetails> findByEmployeeIdAndTenantCode(String employeeId, String tenantCode);
    Optional<EmployeeDetails> findByOfficialEmailAndTenantCode(String officialEmail, String tenantCode);
    Optional<EmployeeDetails> findByUserId(Long userId);

    boolean existsByEmployeeIdAndTenantCode(String employeeId, String tenantCode);
    boolean existsByOfficialEmailAndTenantCode(String officialEmail, String tenantCode);
    boolean existsByUserId(Long userId);
    void deleteByUserId(Long userId);

    List<EmployeeDetails> findByTenantCode(String tenantCode);
    
 // Add this method to EmployeeDetailsRepository
    List<EmployeeDetails> findByTenantCodeAndDesignation(String tenantCode, String designation);
    
 // Find all employees whose teamLeader field matches the given employeeId (the team lead's own ID)
    List<EmployeeDetails> findByTenantCodeAndTeamLeader(String tenantCode, String teamLeaderEmployeeId);
    Optional<EmployeeDetails> findByOfficialEmail(String officialEmail);


}

//package com.hireconnect.repository;
//
//import com.hireconnect.entity.EmployeeDetails;
//import org.springframework.data.jpa.repository.JpaRepository;
//import org.springframework.stereotype.Repository;
//
//import java.util.List;
//import java.util.Optional;
//
//@Repository
//public interface EmployeeDetailsRepository extends JpaRepository<EmployeeDetails, Long> {
//    Optional<EmployeeDetails> findByOfficialEmail(String officialEmail);
//    Optional<EmployeeDetails> findByOfficialEmailAndTenantCode(String officialEmail, String tenantCode);
//    boolean existsByEmployeeIdAndTenantCode(String employeeId, String tenantCode);
//    boolean existsByOfficialEmailAndTenantCode(String officialEmail, String tenantCode);
//
//    List<EmployeeDetails> findByTenantCode(String tenantCode);
//
//    // ✅ Team members under a Team Lead (teamLeader column stores TL's employeeId)
//    List<EmployeeDetails> findByTenantCodeAndTeamLeader(String tenantCode, String teamLeaderEmployeeId);
//
//    // ✅ For dropdown: get Team Leads list
//    List<EmployeeDetails> findByTenantCodeAndDesignation(String tenantCode, String designation);
//}