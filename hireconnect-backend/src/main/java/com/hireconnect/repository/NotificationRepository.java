package com.hireconnect.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.hireconnect.entity.Notification;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findAllByOrderByCreatedAtDesc();

    @Query(
        "SELECT n FROM Notification n WHERE " +
        "n.status = 'PUBLISHED' " +
        "AND n.scheduledAt <= :now " +
        "AND (n.expiresAt IS NULL OR n.expiresAt > :now) " +
        "AND (" +
            "n.targetType = 'ALL' " +
            "OR (n.targetType = 'DEPT' AND :dept MEMBER OF n.targetDepts) " +
            "OR (n.targetType = 'SPECIFIC' AND :empId MEMBER OF n.targetEmployeeIds)" +
        ")"
    )
    List<Notification> findRelevantNotifications(
            String empId,
            String dept,
            LocalDateTime now
    );
}