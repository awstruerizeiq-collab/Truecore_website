package com.hireconnect.controller;

import com.hireconnect.dto.response.ApiResponse;
import com.hireconnect.dto.response.SystemLogsOverviewResponse;
import com.hireconnect.service.GlobalAdminAccessService;
import com.hireconnect.service.SystemLogsService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/global-admin/system-logs")
@CrossOrigin(origins = "*")
public class SystemLogsController {

    private final SystemLogsService systemLogsService;
    private final GlobalAdminAccessService globalAdminAccessService;

    public SystemLogsController(
            SystemLogsService systemLogsService,
            GlobalAdminAccessService globalAdminAccessService
    ) {
        this.systemLogsService = systemLogsService;
        this.globalAdminAccessService = globalAdminAccessService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<SystemLogsOverviewResponse>> getSystemLogs(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "action", required = false) String action,
            @RequestParam(value = "from", required = false) String from,
            @RequestParam(value = "to", required = false) String to,
            @RequestParam(value = "limit", required = false) Integer limit
    ) {
        try {
            validateGlobalAdmin(authHeader);
            LocalDateTime fromDate = parseStartOfDay(from);
            LocalDateTime toDate = parseEndOfDay(to);
            SystemLogsOverviewResponse response = systemLogsService.getOverview(
                    search, action, fromDate, toDate, limit
            );
            return ResponseEntity.ok(ApiResponse.success("System logs fetched", response));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(e.getMessage()));
        }
    }

    private LocalDateTime parseStartOfDay(String date) {
        if (date == null || date.isBlank()) return null;
        return LocalDate.parse(date.trim()).atStartOfDay();
    }

    private LocalDateTime parseEndOfDay(String date) {
        if (date == null || date.isBlank()) return null;
        return LocalDate.parse(date.trim()).atTime(23, 59, 59);
    }

    private String validateGlobalAdmin(String authHeader) {
        return globalAdminAccessService.validate(authHeader, "Only Global Admin can access system logs");
    }
}

