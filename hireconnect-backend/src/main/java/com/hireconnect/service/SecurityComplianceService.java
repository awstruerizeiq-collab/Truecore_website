package com.hireconnect.service;

import com.hireconnect.dto.response.AuditLogResponse;
import com.hireconnect.dto.response.SecurityComplianceOverviewResponse;
import com.hireconnect.entity.AuditLog;
import com.hireconnect.entity.GlobalSystemSettings;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Service
public class SecurityComplianceService {

    private final GlobalSystemSettingsService globalSystemSettingsService;
    private final AuditService auditService;

    public SecurityComplianceService(
            GlobalSystemSettingsService globalSystemSettingsService,
            AuditService auditService
    ) {
        this.globalSystemSettingsService = globalSystemSettingsService;
        this.auditService = auditService;
    }

    public SecurityComplianceOverviewResponse getOverview() {
        GlobalSystemSettings settings = globalSystemSettingsService.getSettings();
        List<AuditLog> logs = auditService.getAllAuditLogs();
        LocalDateTime threshold = LocalDateTime.now().minusHours(24);

        long logsLast24h = logs.stream()
                .filter(log -> log.getCreatedAt() != null && !log.getCreatedAt().isBefore(threshold))
                .count();

        long failedLoginLast24h = logs.stream()
                .filter(log -> log.getCreatedAt() != null && !log.getCreatedAt().isBefore(threshold))
                .filter(log -> {
                    String action = String.valueOf(log.getAction()).toLowerCase(Locale.ROOT);
                    String details = String.valueOf(log.getDetails()).toLowerCase(Locale.ROOT);
                    return action.contains("login") && (action.contains("fail") || details.contains("fail"));
                })
                .count();

        List<AuditLogResponse> recent = logs.stream()
                .limit(10)
                .map(this::toResponse)
                .toList();

        SecurityComplianceOverviewResponse response = new SecurityComplianceOverviewResponse();
        response.setSettings(settings);
        response.setTotalAuditLogs(logs.size());
        response.setAuditLogsLast24Hours(logsLast24h);
        response.setFailedLoginEventsLast24Hours(failedLoginLast24h);
        response.setRecentAuditLogs(recent);
        return response;
    }

    private AuditLogResponse toResponse(AuditLog log) {
        AuditLogResponse response = new AuditLogResponse();
        response.setId(log.getId());
        response.setUserId(log.getUserId());
        response.setPerformedBy(log.getPerformedBy());
        response.setAction(log.getAction());
        response.setDetails(log.getDetails());
        response.setIpAddress(log.getIpAddress());
        response.setUserAgent(log.getUserAgent());
        response.setCreatedAt(log.getCreatedAt() != null ? log.getCreatedAt().toString() : null);
        return response;
    }
}

