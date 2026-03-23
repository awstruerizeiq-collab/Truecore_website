package com.hireconnect.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.hireconnect.entity.PayrollHistory;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PayrollHistoryRepository extends JpaRepository<PayrollHistory, Long> 
{
    
    List<PayrollHistory> findByUserIdOrderByPayrollMonthDesc(Long userId);

    @Query("""
        SELECT p FROM PayrollHistory p
        JOIN User u ON u.id = p.userId
        WHERE u.companyId = :companyId
        ORDER BY p.payrollMonth DESC, p.createdAt DESC
    """)
    List<PayrollHistory> findAllByCompanyIdOrderByPayrollMonthDesc(@Param("companyId") Long companyId);

    @Query("""
        SELECT p FROM PayrollHistory p
        JOIN User u ON u.id = p.userId
        WHERE p.userId = :userId
          AND u.companyId = :companyId
        ORDER BY p.payrollMonth DESC, p.createdAt DESC
    """)
    List<PayrollHistory> findByUserIdAndCompanyIdOrderByPayrollMonthDesc(@Param("userId") Long userId,
                                                                          @Param("companyId") Long companyId);

    @Query("""
        SELECT p FROM PayrollHistory p
        JOIN User u ON u.id = p.userId
        WHERE p.id = :id
          AND u.companyId = :companyId
    """)
    Optional<PayrollHistory> findByIdAndCompanyId(@Param("id") Long id, @Param("companyId") Long companyId);
    
    @Query("SELECT p FROM PayrollHistory p WHERE p.userId = :userId AND p.payrollMonth = :month")
    Optional<PayrollHistory> findByUserIdAndMonth(@Param("userId") Long userId, 
                                                   @Param("month") LocalDate month);
    
    List<PayrollHistory> findByStatus(PayrollHistory.PayrollStatus status);
    
    @Query("SELECT p FROM PayrollHistory p WHERE FUNCTION('YEAR', p.payrollMonth) = :year AND FUNCTION('MONTH', p.payrollMonth) = :month")
    List<PayrollHistory> findByYearAndMonth(@Param("year") int year, @Param("month") int month);
}