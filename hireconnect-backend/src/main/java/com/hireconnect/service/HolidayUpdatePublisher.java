package com.hireconnect.service;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.TimeUnit;

@Component
public class HolidayUpdatePublisher {

    private static final long STREAM_TIMEOUT_MS = TimeUnit.MINUTES.toMillis(30); // keeps connections alive, reconnect on timeout
    private final List<Subscription> subscribers = new CopyOnWriteArrayList<>();

    public SseEmitter subscribe(String tenantCode, Long companyId) {
        SseEmitter emitter = new SseEmitter(STREAM_TIMEOUT_MS);
        Subscription subscription = new Subscription(emitter, normalize(tenantCode), companyId);
        subscribers.add(subscription);

        emitter.onCompletion(() -> subscribers.remove(subscription));
        emitter.onTimeout(() -> {
            subscribers.remove(subscription);
            emitter.complete();
        });
        emitter.onError(e -> {
            subscribers.remove(subscription);
            emitter.complete();
        });

        try {
            emitter.send(SseEmitter.event().name("ping").data("connected"));
        } catch (IOException ignored) {
            emitter.complete();
        }
        return emitter;
    }

    public void publishChange(String tenantCode, Long companyId) {
        String normalizedTenant = normalize(tenantCode);
        Instant now = Instant.now();
        List<Subscription> dead = new ArrayList<>();

        for (Subscription sub : subscribers) {
            if (!matches(sub, normalizedTenant, companyId)) continue;
            try {
                sub.emitter.send(SseEmitter.event()
                        .name("holiday-updated")
                        .data(new HolidayEvent(normalizedTenant, companyId, now.toString())));
            } catch (IOException e) {
                sub.emitter.complete();
                dead.add(sub);
            }
        }
        subscribers.removeAll(dead);
    }

    private boolean matches(Subscription sub, String tenantCode, Long companyId) {
        boolean tenantMatch = sub.tenantCode.equals(tenantCode);
        boolean companyMatch = (sub.companyId == null && companyId == null)
                || (sub.companyId != null && companyId != null && sub.companyId.equals(companyId));
        return tenantMatch && companyMatch;
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim();
    }

    private static class Subscription {
        private final SseEmitter emitter;
        private final String tenantCode;
        private final Long companyId;

        Subscription(SseEmitter emitter, String tenantCode, Long companyId) {
            this.emitter = emitter;
            this.tenantCode = tenantCode;
            this.companyId = companyId;
        }
    }

    public record HolidayEvent(String tenantCode, Long companyId, String updatedAt) { }
}
