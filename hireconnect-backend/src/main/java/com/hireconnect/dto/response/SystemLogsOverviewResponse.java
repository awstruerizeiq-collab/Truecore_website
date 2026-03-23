package com.hireconnect.dto.response;

import java.util.ArrayList;
import java.util.List;

public class SystemLogsOverviewResponse {
    private long totalLogs;
    private long filteredLogs;
    private long logsLast24Hours;
    private List<AuditLogResponse> logs = new ArrayList<>();

    public long getTotalLogs() {
        return totalLogs;
    }

    public void setTotalLogs(long totalLogs) {
        this.totalLogs = totalLogs;
    }

    public long getFilteredLogs() {
        return filteredLogs;
    }

    public void setFilteredLogs(long filteredLogs) {
        this.filteredLogs = filteredLogs;
    }

    public long getLogsLast24Hours() {
        return logsLast24Hours;
    }

    public void setLogsLast24Hours(long logsLast24Hours) {
        this.logsLast24Hours = logsLast24Hours;
    }

    public List<AuditLogResponse> getLogs() {
        return logs;
    }

    public void setLogs(List<AuditLogResponse> logs) {
        this.logs = logs;
    }
}

