package com.hireconnect.controller;

import com.hireconnect.dto.response.ApiResponse;
import com.hireconnect.dto.response.AuditLogResponse;
import com.hireconnect.entity.AuditLog;
import com.hireconnect.service.AuditService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/audit")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AuditController {
    
    private final AuditService auditService;
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<AuditLogResponse>>> getUserAuditLogs(@PathVariable Long userId) {
        try {
            List<AuditLog> logs = auditService.getAuditLogsByUser(userId);
            return ResponseEntity.ok(ApiResponse.success("Audit logs fetched", toResponse(logs)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/performer/{performerId}")
    public ResponseEntity<ApiResponse<List<AuditLogResponse>>> getPerformerAuditLogs(@PathVariable Long performerId) {
        try {
            List<AuditLog> logs = auditService.getAuditLogsByPerformer(performerId);
            return ResponseEntity.ok(ApiResponse.success("Audit logs fetched", toResponse(logs)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<AuditLogResponse>>> getAllAuditLogs() {
        try {
            List<AuditLog> logs = auditService.getAllAuditLogs();
            return ResponseEntity.ok(ApiResponse.success("Audit logs fetched", toResponse(logs)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    private List<AuditLogResponse> toResponse(List<AuditLog> logs) {
        return logs.stream().map(this::toResponse).collect(Collectors.toList());
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