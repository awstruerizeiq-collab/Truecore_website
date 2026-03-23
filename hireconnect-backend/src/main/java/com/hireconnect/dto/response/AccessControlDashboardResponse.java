package com.hireconnect.dto.response;

import java.time.LocalDateTime;
import java.util.Map;

public class AccessControlDashboardResponse {

    private int totalModules;
    private long activePolicies;
    private long devicesConnected;
    private LocalDateTime lastAudit;
    private Map<String, Long> biometricStats;

    public int getTotalModules() {
        return totalModules;
    }

    public void setTotalModules(int totalModules) {
        this.totalModules = totalModules;
    }

    public long getActivePolicies() {
        return activePolicies;
    }

    public void setActivePolicies(long activePolicies) {
        this.activePolicies = activePolicies;
    }

    public long getDevicesConnected() {
        return devicesConnected;
    }

    public void setDevicesConnected(long devicesConnected) {
        this.devicesConnected = devicesConnected;
    }

    public LocalDateTime getLastAudit() {
        return lastAudit;
    }

    public void setLastAudit(LocalDateTime lastAudit) {
        this.lastAudit = lastAudit;
    }

    public Map<String, Long> getBiometricStats() {
        return biometricStats;
    }

    public void setBiometricStats(Map<String, Long> biometricStats) {
        this.biometricStats = biometricStats;
    }
}
