package com.hireconnect.controller;

import com.hireconnect.dto.request.FingerprintVerificationRequest;
import com.hireconnect.dto.response.ApiResponse;
import com.hireconnect.dto.response.FingerprintVerificationResponse;
import com.hireconnect.service.AccessControlService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/access-device")
@CrossOrigin(origins = "*")
public class AccessDeviceController {

    private final AccessControlService accessControlService;

    public AccessDeviceController(AccessControlService accessControlService) {
        this.accessControlService = accessControlService;
    }

    @PostMapping("/fingerprint/verify")
    public ResponseEntity<ApiResponse<FingerprintVerificationResponse>> verifyFingerprint(
        @RequestHeader(value = "X-API-KEY", required = false) String apiKey,
        @RequestBody FingerprintVerificationRequest request
    ) {
        try {
            AccessControlService.VerifyFingerprintResult result =
                accessControlService.verifyFingerprint(apiKey, request);

            if (result.isSuccess()) {
                return ResponseEntity.ok(ApiResponse.success(result.getMessage(), result.getData()));
            }
            return ResponseEntity.ok(new ApiResponse<>(false, result.getMessage(), result.getData()));
        } catch (AccessControlService.AccessDeviceAuthException authException) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error(authException.getMessage()));
        }
    }
}
