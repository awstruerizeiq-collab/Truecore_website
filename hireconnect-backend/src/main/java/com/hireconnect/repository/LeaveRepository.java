package com.hireconnect.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.hireconnect.entity.Leave;

@Repository
public interface LeaveRepository extends JpaRepository<Leave, Long> {
    
    List<Leave> findByUserId(Long userId);
    
    List<Leave> findByStatus(Leave.LeaveStatus status);
    
    @Query("SELECT l FROM Leave l WHERE l.userId = :userId AND l.status = 'APPROVED' AND " +
           "((l.startDate BETWEEN :startDate AND :endDate) OR " +
           "(l.endDate BETWEEN :startDate AND :endDate) OR " +
           "(l.startDate <= :startDate AND l.endDate >= :endDate))")
    List<Leave> findApprovedLeavesByUserIdAndDateRange(@Param("userId") Long userId,
                                                        @Param("startDate") LocalDate startDate,
                                                        @Param("endDate") LocalDate endDate);
    
    @Query("SELECT COUNT(l) FROM Leave l WHERE l.status = 'PENDING'")
    long countPendingLeaves();
    
    @Query("SELECT l FROM Leave l WHERE l.userId = :userId ORDER BY l.createdAt DESC")
    List<Leave> findByUserIdOrderByCreatedAtDesc(@Param("userId") Long userId);
}