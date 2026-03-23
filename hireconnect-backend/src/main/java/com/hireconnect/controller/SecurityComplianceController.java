package com.hireconnect.controller;

import com.hireconnect.dto.request.GlobalSystemSettingsRequest;
import com.hireconnect.dto.response.ApiResponse;
import com.hireconnect.dto.response.SecurityComplianceOverviewResponse;
import com.hireconnect.entity.GlobalSystemSettings;
import com.hireconnect.service.GlobalAdminAccessService;
import com.hireconnect.service.GlobalSystemSettingsService;
import com.hireconnect.service.SecurityComplianceService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/global-admin/security-compliance")
@CrossOrigin(origins = "*")
public class SecurityComplianceController {

    private final SecurityComplianceService securityComplianceService;
    private final GlobalSystemSettingsService globalSystemSettingsService;
    private final GlobalAdminAccessService globalAdminAccessService;

    public SecurityComplianceController(
            SecurityComplianceService securityComplianceService,
            GlobalSystemSettingsService globalSystemSettingsService,
            GlobalAdminAccessService globalAdminAccessService
    ) {
        this.securityComplianceService = securityComplianceService;
        this.globalSystemSettingsService = globalSystemSettingsService;
        this.globalAdminAccessService = globalAdminAccessService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<SecurityComplianceOverviewResponse>> getOverview(
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        try {
            validateGlobalAdmin(authHeader);
            SecurityComplianceOverviewResponse overview = securityComplianceService.getOverview();
            return ResponseEntity.ok(ApiResponse.success("Security compliance overview fetched", overview));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/settings")
    public ResponseEntity<ApiResponse<GlobalSystemSettings>> updateSettings(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody GlobalSystemSettingsRequest request
    ) {
        try {
            String email = validateGlobalAdmin(authHeader);
            GlobalSystemSettings updated = globalSystemSettingsService.updateSettings(request, email);
            return ResponseEntity.ok(ApiResponse.success("Security settings updated", updated));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(e.getMessage()));
        }
    }

    private String validateGlobalAdmin(String authHeader) {
        return globalAdminAccessService.validate(authHeader, "Only Global Admin can access security compliance settings");
    }
}

