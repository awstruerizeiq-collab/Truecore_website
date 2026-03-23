package com.hireconnect.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.hireconnect.entity.CorrectionRequest;

import java.util.List;

@Repository
public interface CorrectionRequestRepository extends JpaRepository<CorrectionRequest, Long> {
    
    List<CorrectionRequest> findByUserId(Long userId);
    
    List<CorrectionRequest> findByStatus(CorrectionRequest.CorrectionStatus status);
    
    @Query("SELECT COUNT(c) FROM CorrectionRequest c WHERE c.status = 'PENDING'")
    long countPendingCorrections();
}