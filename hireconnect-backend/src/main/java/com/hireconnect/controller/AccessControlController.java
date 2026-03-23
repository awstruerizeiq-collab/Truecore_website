package com.hireconnect.controller;

import com.hireconnect.dto.request.AccessControlModuleConfigRequest;
import com.hireconnect.dto.response.AccessControlDashboardResponse;
import com.hireconnect.dto.response.AccessControlModuleConfigResponse;
import com.hireconnect.dto.response.ApiResponse;
import com.hireconnect.dto.response.BiometricVerificationLogResponse;
import com.hireconnect.service.AccessControlService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/super-admin/access-control")
@CrossOrigin(origins = "*")
public class AccessControlController {

    private final AccessControlService accessControlService;

    public AccessControlController(AccessControlService accessControlService) {
        this.accessControlService = accessControlService;
    }

    @PostMapping("/modules/{moduleKey}")
    public ResponseEntity<ApiResponse<AccessControlModuleConfigResponse>> saveModuleConfiguration(
        @PathVariable String moduleKey,
        @RequestBody AccessControlModuleConfigRequest request
    ) {
        AccessControlModuleConfigResponse response =
            accessControlService.saveModuleConfiguration(moduleKey, request);
        return ResponseEntity.ok(ApiResponse.success("Module configuration saved successfully", response));
    }

    @GetMapping("/modules")
    public ResponseEntity<ApiResponse<List<AccessControlModuleConfigResponse>>> getModuleConfigurations(
        @RequestParam Long companyId
    ) {
        List<AccessControlModuleConfigResponse> response =
            accessControlService.getModuleConfigurations(companyId);
        return ResponseEntity.ok(ApiResponse.success("Module configurations fetched successfully", response));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<AccessControlDashboardResponse>> getDashboardSummary(
        @RequestParam Long companyId
    ) {
        AccessControlDashboardResponse response = accessControlService.getDashboardSummary(companyId);
        return ResponseEntity.ok(ApiResponse.success("Access control dashboard fetched successfully", response));
    }

    @GetMapping("/activity")
    public ResponseEntity<ApiResponse<List<BiometricVerificationLogResponse>>> getRecentActivity(
        @RequestParam Long companyId
    ) {
        List<BiometricVerificationLogResponse> response = accessControlService.getRecentActivity(companyId);
        return ResponseEntity.ok(ApiResponse.success("Recent activity fetched successfully", response));
    }
}
