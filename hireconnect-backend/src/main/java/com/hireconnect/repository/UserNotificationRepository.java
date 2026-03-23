package com.hireconnect.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.hireconnect.entity.UserNotification;

@Repository
public interface UserNotificationRepository extends JpaRepository<UserNotification, Long> {
    
    // Finds a specific interaction (e.g., "Did Employee John read Notification #5?")
    Optional<UserNotification> findByNotificationIdAndEmployeeId(Long notifId, String empId);
    
    // Finds all interactions for a specific employee
    List<UserNotification> findByEmployeeId(String empId);
}