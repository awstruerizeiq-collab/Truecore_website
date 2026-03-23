package com.hireconnect.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.hireconnect.dto.request.PerformanceRequest;
import com.hireconnect.dto.response.ApiResponse;
import com.hireconnect.dto.response.PerformanceResponse;
import com.hireconnect.service.PerformanceService;

@RestController
@RequestMapping("/api/performance")
@CrossOrigin(origins = "*")
public class PerformanceController {
    @Autowired
    private PerformanceService performanceService;

    // Admin all (not tenant)
    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<PerformanceResponse>>> getAllPerformance() {
        List<PerformanceResponse> data = performanceService.getAllPerformance();
        return ResponseEntity.ok(ApiResponse.success("Performance data fetched successfully", data));
    }

    // ✅ Tenant all (dashboard)
    @GetMapping("/tenant/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<PerformanceResponse>>> getTenantPerformance(
            @RequestHeader("X-Tenant-Code") String tenantCode
    ) {
        List<PerformanceResponse> data = performanceService.getTenantPerformance(tenantCode);
        return ResponseEntity.ok(ApiResponse.success("Tenant performance fetched successfully", data));
    }

    // ✅ Tenant top performers (employee leaderboard)
    @GetMapping("/tenant/top")
    public ResponseEntity<ApiResponse<List<PerformanceResponse>>> getTopTenantPerformance(
            @RequestHeader("X-Tenant-Code") String tenantCode,
            @RequestHeader(value = "X-Company-Id", required = false) String companyId,
            @RequestParam(value = "limit", defaultValue = "5") int limit
    ) {
        List<PerformanceResponse> data = performanceService.getTopTenantPerformance(tenantCode, limit);
        return ResponseEntity.ok(ApiResponse.success("Top performers fetched successfully", data));
    }

    // ✅ Current employee (self)
    @GetMapping("/employee")
    public ResponseEntity<ApiResponse<PerformanceResponse>> getCurrentEmployeePerformance() {
        try {
            PerformanceResponse data = performanceService.getCurrentUserPerformance();
            return ResponseEntity.ok(ApiResponse.success("Employee performance fetched successfully", data));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PerformanceResponse>> createPerformance(
            @RequestHeader("X-Tenant-Code") String tenantCode,
            @RequestBody PerformanceRequest request
    ) {
        try {
            PerformanceResponse created = performanceService.createPerformance(request, tenantCode);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Performance record created successfully", created));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PerformanceResponse>> updatePerformance(
            @RequestHeader("X-Tenant-Code") String tenantCode,
            @PathVariable Long id,
            @RequestBody PerformanceRequest request
    ) {
        try {
            PerformanceResponse updated = performanceService.updatePerformance(id, request, tenantCode);
            return ResponseEntity.ok(ApiResponse.success("Performance record updated successfully", updated));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/validate/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> validatePerformance(
            @RequestHeader("X-Tenant-Code") String tenantCode,
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> request
    ) {
        try {
            Boolean validated = request.get("validated");
            performanceService.setValidationStatus(id, validated, tenantCode);
            String message = Boolean.TRUE.equals(validated)
                    ? "Performance validated successfully"
                    : "Validation revoked successfully";
            return ResponseEntity.ok(ApiResponse.success(message, null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> deletePerformance(
            @RequestHeader("X-Tenant-Code") String tenantCode,
            @PathVariable Long id
    ) {
        try {
            performanceService.deletePerformance(id, tenantCode);
            return ResponseEntity.ok(ApiResponse.success("Performance record deleted successfully", null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/team-lead/context")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTeamLeadContext() {
        try {
            Map<String, Object> data = performanceService.getCurrentTeamLeadContext();
            return ResponseEntity.ok(ApiResponse.success("Team lead context fetched", data));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/team-lead/members")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getTeamLeadMembers() {
        try {
            List<Map<String, Object>> data = performanceService.getCurrentTeamLeadMembers();
            return ResponseEntity.ok(ApiResponse.success("Team members fetched", data));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/team-lead/rank-list")
    public ResponseEntity<ApiResponse<List<PerformanceResponse>>> getTeamLeadRankList() {
        try {
            List<PerformanceResponse> data = performanceService.getCurrentTeamLeadRankList();
            return ResponseEntity.ok(ApiResponse.success("Team rank list fetched", data));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/team-lead")
    public ResponseEntity<ApiResponse<PerformanceResponse>> createTeamLeadPerformance(
            @RequestBody PerformanceRequest request
    ) {
        try {
            PerformanceResponse created = performanceService.createPerformanceForCurrentTeamLead(request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Performance record created successfully", created));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
}