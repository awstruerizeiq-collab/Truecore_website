package com.hireconnect.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hireconnect.dto.request.GlobalSystemSettingsRequest;
import com.hireconnect.dto.response.ApiResponse;
import com.hireconnect.entity.GlobalSystemSettings;
import com.hireconnect.service.GlobalAdminAccessService;
import com.hireconnect.service.GlobalSystemSettingsService;

@RestController
@RequestMapping("/api/global-admin/settings")
@CrossOrigin(origins = "*")
public class GlobalSystemSettingsController {

    private final GlobalSystemSettingsService settingsService;
    private final GlobalAdminAccessService globalAdminAccessService;

    public GlobalSystemSettingsController(
            GlobalSystemSettingsService settingsService,
            GlobalAdminAccessService globalAdminAccessService) {
        this.settingsService = settingsService;
        this.globalAdminAccessService = globalAdminAccessService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<GlobalSystemSettings>> getSettings(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            validateGlobalAdmin(authHeader);
            GlobalSystemSettings settings = settingsService.getSettings();
            return ResponseEntity.ok(ApiResponse.success("Settings fetched", settings));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping
    public ResponseEntity<ApiResponse<GlobalSystemSettings>> updateSettings(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody GlobalSystemSettingsRequest request) {
        try {
            String email = validateGlobalAdmin(authHeader);
            GlobalSystemSettings updated = settingsService.updateSettings(request, email);
            return ResponseEntity.ok(ApiResponse.success("Settings updated", updated));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(e.getMessage()));
        }
    }

    private String validateGlobalAdmin(String authHeader) {
        return globalAdminAccessService.validate(authHeader, "Only Global Admin can access system settings");
    }
}
