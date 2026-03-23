package com.hireconnect.service;

import com.hireconnect.entity.AuditLog;
import com.hireconnect.repository.AuditLogRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuditService {
    
    private final AuditLogRepository auditLogRepository;
    
    @Transactional
    public void createAuditLog(Long userId, Long performedBy, String action, String details) {
        AuditLog auditLog = new AuditLog();
        auditLog.setUserId(userId);
        auditLog.setPerformedBy(performedBy);
        auditLog.setAction(action);
        auditLog.setDetails(details);
        auditLog.setCreatedAt(LocalDateTime.now());
        auditLogRepository.save(auditLog);
    }
    
    @Transactional
    public void createAuditLog(Long userId, Long performedBy, String action, String details, 
                              String ipAddress, String userAgent) {
        AuditLog auditLog = new AuditLog();
        auditLog.setUserId(userId);
        auditLog.setPerformedBy(performedBy);
        auditLog.setAction(action);
        auditLog.setDetails(details);
        auditLog.setIpAddress(ipAddress);
        auditLog.setUserAgent(userAgent);
        auditLog.setCreatedAt(LocalDateTime.now());
        auditLogRepository.save(auditLog);
    }
    
    public List<AuditLog> getAuditLogsByUser(Long userId) {
        try {
            return auditLogRepository.findByUserIdOrderByCreatedAtDesc(userId);
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }
    
    public List<AuditLog> getAuditLogsByPerformer(Long performedBy) {
        try {
            return auditLogRepository.findByPerformedByOrderByCreatedAtDesc(performedBy);
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    public List<AuditLog> getAllAuditLogs() {
        try {
            return auditLogRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }
}