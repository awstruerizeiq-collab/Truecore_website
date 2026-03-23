package com.hireconnect.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.hireconnect.entity.EmployeeLeaveBalance;

@Repository
public interface EmployeeLeaveBalanceRepository extends JpaRepository<EmployeeLeaveBalance, Long> {

    Optional<EmployeeLeaveBalance> findByEmployeeIdAndYear(Long employeeId, Integer year);
}
