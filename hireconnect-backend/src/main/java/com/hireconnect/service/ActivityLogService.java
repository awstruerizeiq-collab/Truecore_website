package com.hireconnect.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hireconnect.entity.ActivityLog;
import com.hireconnect.repository.ActivityLogRepository;

@Service
public class ActivityLogService {

    private final ActivityLogRepository repository;

    public ActivityLogService(ActivityLogRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public ActivityLog log(String eventType, String message, String severity, String tag,
                           Long companyId, String tenantCode, Long actorUserId, String actorName) {

        ActivityLog a = new ActivityLog();
        a.setEventType(safe(eventType, "UNKNOWN"));
        a.setMessage(safe(message, "Activity"));
        a.setSeverity(normalizeSeverity(severity));
        a.setTag(tag);
        a.setCompanyId(companyId);
        a.setTenantCode(tenantCode);
        a.setActorUserId(actorUserId);
        a.setActorName(actorName);

        return repository.save(a);
    }

    @Transactional
    public ActivityLog log(String eventType, String message) {
        return log(eventType, message, "info", null, null, null, null, null);
    }

    private String safe(String value, String fallback) {
        if (value == null) return fallback;
        String v = value.trim();
        return v.isEmpty() ? fallback : v;
    }

    private String normalizeSeverity(String severity) {
        if (severity == null) return "info";
        String s = severity.trim().toLowerCase();
        return switch (s) {
            case "success", "warning", "danger", "info" -> s;
            default -> "info";
        };
    }
}