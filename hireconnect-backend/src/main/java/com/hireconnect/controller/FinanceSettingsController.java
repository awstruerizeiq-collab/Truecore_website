package com.hireconnect.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.hireconnect.dto.request.FinanceSettingsRequest;
import com.hireconnect.dto.response.ApiResponse;
import com.hireconnect.dto.response.FinanceSettingsResponse;
import com.hireconnect.service.FinanceSettingsService;

@RestController
@RequestMapping("/api/finance/settings")
@CrossOrigin(origins = "*")
public class FinanceSettingsController {

    private final FinanceSettingsService financeSettingsService;

    public FinanceSettingsController(FinanceSettingsService financeSettingsService) {
        this.financeSettingsService = financeSettingsService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<FinanceSettingsResponse>> getSettings(
        @RequestHeader(value = "X-Company-Id", required = false) Long companyHeader,
        @RequestParam(value = "companyId", required = false) Long companyParam,
        @RequestHeader(value = "X-Tenant-Code", required = false) String tenantHeader,
        @RequestParam(value = "tenantCode", required = false) String tenantParam
    ) {
        try {
            Long companyId = resolveCompanyId(companyHeader, companyParam, null);
            String tenantCode = resolveTenantCode(tenantHeader, tenantParam, null);
            FinanceSettingsResponse response = financeSettingsService.getSettings(companyId, tenantCode);
            return ResponseEntity.ok(ApiResponse.success("Finance settings fetched", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping
    public ResponseEntity<ApiResponse<FinanceSettingsResponse>> updateSettings(
        @RequestHeader(value = "X-Company-Id", required = false) Long companyHeader,
        @RequestParam(value = "companyId", required = false) Long companyParam,
        @RequestHeader(value = "X-Tenant-Code", required = false) String tenantHeader,
        @RequestParam(value = "tenantCode", required = false) String tenantParam,
        @RequestBody FinanceSettingsRequest request
    ) {
        try {
            Long companyId = resolveCompanyId(companyHeader, companyParam, request == null ? null : request.getCompanyId());
            String tenantCode = resolveTenantCode(
                tenantHeader,
                tenantParam,
                request == null ? null : request.getTenantCode()
            );

            FinanceSettingsRequest safeRequest = request == null ? new FinanceSettingsRequest() : request;
            FinanceSettingsResponse response = financeSettingsService.saveOrUpdate(companyId, tenantCode, safeRequest);
            return ResponseEntity.ok(ApiResponse.success("Finance settings updated", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    private Long resolveCompanyId(Long companyHeader, Long companyParam, Long companyBody) {
        if (companyHeader != null) return companyHeader;
        if (companyParam != null) return companyParam;
        if (companyBody != null) return companyBody;
        throw new RuntimeException("companyId is required");
    }

    private String resolveTenantCode(String tenantHeader, String tenantParam, String tenantBody) {
        if (tenantHeader != null && !tenantHeader.isBlank()) {
            return tenantHeader.trim();
        }
        if (tenantParam != null && !tenantParam.isBlank()) {
            return tenantParam.trim();
        }
        if (tenantBody != null && !tenantBody.isBlank()) {
            return tenantBody.trim();
        }
        return null;
    }
}
