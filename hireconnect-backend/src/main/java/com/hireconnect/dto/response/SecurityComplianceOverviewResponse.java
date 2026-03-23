package com.hireconnect.dto.response;

import com.hireconnect.entity.GlobalSystemSettings;

import java.util.ArrayList;
import java.util.List;

public class SecurityComplianceOverviewResponse {
    private GlobalSystemSettings settings;
    private long totalAuditLogs;
    private long auditLogsLast24Hours;
    private long failedLoginEventsLast24Hours;
    private List<AuditLogResponse> recentAuditLogs = new ArrayList<>();

    public GlobalSystemSettings getSettings() {
        return settings;
    }

    public void setSettings(GlobalSystemSettings settings) {
        this.settings = settings;
    }

    public long getTotalAuditLogs() {
        return totalAuditLogs;
    }

    public void setTotalAuditLogs(long totalAuditLogs) {
        this.totalAuditLogs = totalAuditLogs;
    }

    public long getAuditLogsLast24Hours() {
        return auditLogsLast24Hours;
    }

    public void setAuditLogsLast24Hours(long auditLogsLast24Hours) {
        this.auditLogsLast24Hours = auditLogsLast24Hours;
    }

    public long getFailedLoginEventsLast24Hours() {
        return failedLoginEventsLast24Hours;
    }

    public void setFailedLoginEventsLast24Hours(long failedLoginEventsLast24Hours) {
        this.failedLoginEventsLast24Hours = failedLoginEventsLast24Hours;
    }

    public List<AuditLogResponse> getRecentAuditLogs() {
        return recentAuditLogs;
    }

    public void setRecentAuditLogs(List<AuditLogResponse> recentAuditLogs) {
        this.recentAuditLogs = recentAuditLogs;
    }
}

