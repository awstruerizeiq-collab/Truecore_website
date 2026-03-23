package com.hireconnect.repository;

import java.time.LocalDateTime;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.hireconnect.entity.ActivityLog;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {

    Page<ActivityLog> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<ActivityLog> findByCompanyIdOrderByCreatedAtDesc(Long companyId, Pageable pageable);

    Page<ActivityLog> findByEventTypeOrderByCreatedAtDesc(String eventType, Pageable pageable);

    Page<ActivityLog> findByCreatedAtBetweenOrderByCreatedAtDesc(
            LocalDateTime from,
            LocalDateTime to,
            Pageable pageable);
}
