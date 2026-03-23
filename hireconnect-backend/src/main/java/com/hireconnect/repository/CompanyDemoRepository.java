package com.hireconnect.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.hireconnect.entity.CompanyDemoDetails;
import com.hireconnect.entity.CompanyDemoDetails.DemoStatus;

@Repository
public interface CompanyDemoRepository extends JpaRepository<CompanyDemoDetails, Long> {
    
    Optional<CompanyDemoDetails> findByCompanyEmail(String companyEmail);
    
    boolean existsByCompanyEmail(String companyEmail);
    
    List<CompanyDemoDetails> findByStatus(DemoStatus status);
    
    List<CompanyDemoDetails> findByCompanyNameContainingIgnoreCase(String companyName);
    
    @Query("SELECT c FROM CompanyDemoDetails c WHERE c.status = :status ORDER BY c.createdAt DESC")
    List<CompanyDemoDetails> findByStatusOrderByCreatedAtDesc(@Param("status") DemoStatus status);
    
    @Query("SELECT c FROM CompanyDemoDetails c ORDER BY c.createdAt DESC")
    List<CompanyDemoDetails> findAllOrderByCreatedAtDesc();
    
    long countByStatus(DemoStatus status);
}