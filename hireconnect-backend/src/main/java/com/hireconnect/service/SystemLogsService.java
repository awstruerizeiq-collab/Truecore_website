package com.hireconnect.service;

import com.hireconnect.dto.response.AuditLogResponse;
import com.hireconnect.dto.response.SystemLogsOverviewResponse;
import com.hireconnect.entity.AuditLog;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Service
public class SystemLogsService {

    private final AuditService auditService;

    public SystemLogsService(AuditService auditService) {
        this.auditService = auditService;
    }

    public SystemLogsOverviewResponse getOverview(
            String search,
            String action,
            LocalDateTime from,
            LocalDateTime to,
            Integer limit
    ) {
        List<AuditLog> allLogs = auditService.getAllAuditLogs();
        LocalDateTime last24hThreshold = LocalDateTime.now().minusHours(24);

        List<AuditLogResponse> filtered = allLogs.stream()
                .filter(log -> matchesSearch(log, search))
                .filter(log -> matchesAction(log, action))
                .filter(log -> matchesDateRange(log, from, to))
                .map(this::toResponse)
                .toList();

        int effectiveLimit = (limit == null || limit <= 0) ? 200 : Math.min(limit, 1000);
        if (filtered.size() > effectiveLimit) {
            filtered = filtered.subList(0, effectiveLimit);
        }

        long logsLast24h = allLogs.stream()
                .filter(log -> log.getCreatedAt() != null && !log.getCreatedAt().isBefore(last24hThreshold))
                .count();

        SystemLogsOverviewResponse response = new SystemLogsOverviewResponse();
        response.setTotalLogs(allLogs.size());
        response.setFilteredLogs(filtered.size());
        response.setLogsLast24Hours(logsLast24h);
        response.setLogs(filtered);
        return response;
    }

    private boolean matchesSearch(AuditLog log, String search) {
        if (search == null || search.isBlank()) return true;
        String q = search.trim().toLowerCase(Locale.ROOT);
        String blob = (
                String.valueOf(log.getAction()) + " " +
                String.valueOf(log.getDetails()) + " " +
                String.valueOf(log.getIpAddress()) + " " +
                String.valueOf(log.getUserAgent()) + " " +
                String.valueOf(log.getUserId()) + " " +
                String.valueOf(log.getPerformedBy())
        ).toLowerCase(Locale.ROOT);
        return blob.contains(q);
    }

    private boolean matchesAction(AuditLog log, String action) {
        if (action == null || action.isBlank()) return true;
        return String.valueOf(log.getAction()).equalsIgnoreCase(action.trim());
    }

    private boolean matchesDateRange(AuditLog log, LocalDateTime from, LocalDateTime to) {
        if (log.getCreatedAt() == null) return false;
        if (from != null && log.getCreatedAt().isBefore(from)) return false;
        if (to != null && log.getCreatedAt().isAfter(to)) return false;
        return true;
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

