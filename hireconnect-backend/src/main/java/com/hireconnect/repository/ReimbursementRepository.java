package com.hireconnect.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.hireconnect.entity.Reimbursement;

import java.util.List;

@Repository
public interface ReimbursementRepository extends JpaRepository<Reimbursement, Long> {
    
    List<Reimbursement> findByUserId(Long userId);

    List<Reimbursement> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    List<Reimbursement> findByStatus(Reimbursement.ReimbursementStatus status);

    List<Reimbursement> findAllByOrderByCreatedAtDesc();
    
    @Query("SELECT COUNT(r) FROM Reimbursement r WHERE r.status = 'PENDING'")
    long countPending();
}
