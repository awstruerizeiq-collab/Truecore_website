package com.hireconnect.controller;

import org.springframework.http.ResponseEntity;
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
import org.springframework.web.multipart.MultipartFile;

import com.hireconnect.dto.request.HolidayRequest;
import com.hireconnect.dto.response.ApiResponse;
import com.hireconnect.service.HolidayService;

@RestController
@RequestMapping("/api/holidays")
@CrossOrigin(origins = "*")
public class HolidayController {

    private final HolidayService holidayService;

    public HolidayController(HolidayService holidayService) {
        this.holidayService = holidayService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<?>> getHolidays(
        @RequestHeader(value = "X-Tenant-Code", required = false) String tenantHeader,
        @RequestHeader(value = "X-Company-Id", required = false) Long companyHeader,
        @RequestParam(value = "tenantCode", required = false) String tenantParam,
        @RequestParam(value = "companyId", required = false) Long companyParam,
        @RequestParam(value = "year", required = false) Integer year,
        @RequestParam(value = "month", required = false) Integer month
    ) {
        try {
            String tenantCode = resolveTenantCode(tenantHeader, tenantParam);
            Long companyId = resolveCompanyId(companyHeader, companyParam);

            var holidays = holidayService.getHolidays(tenantCode, companyId, year, month);
            return ResponseEntity.ok(ApiResponse.success("Holidays fetched", holidays));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<ApiResponse<?>> createHoliday(
        @RequestBody HolidayRequest request,
        @RequestHeader(value = "X-Tenant-Code", required = false) String tenantHeader,
        @RequestHeader(value = "X-Company-Id", required = false) Long companyHeader,
        @RequestParam(value = "tenantCode", required = false) String tenantParam,
        @RequestParam(value = "companyId", required = false) Long companyParam
    ) {
        try {
            String tenantCode = resolveTenantCode(tenantHeader, tenantParam);
            Long companyId = resolveCompanyId(companyHeader, companyParam);

            var holiday = holidayService.createHoliday(request, tenantCode, companyId);
            return ResponseEntity.ok(ApiResponse.success("Holiday created", holiday));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> updateHoliday(
        @PathVariable Long id,
        @RequestBody HolidayRequest request,
        @RequestHeader(value = "X-Tenant-Code", required = false) String tenantHeader,
        @RequestHeader(value = "X-Company-Id", required = false) Long companyHeader,
        @RequestParam(value = "tenantCode", required = false) String tenantParam,
        @RequestParam(value = "companyId", required = false) Long companyParam
    ) {
        try {
            String tenantCode = resolveTenantCode(tenantHeader, tenantParam);
            Long companyId = resolveCompanyId(companyHeader, companyParam);

            var holiday = holidayService.updateHoliday(id, request, tenantCode, companyId);
            return ResponseEntity.ok(ApiResponse.success("Holiday updated", holiday));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> deleteHoliday(
        @PathVariable Long id,
        @RequestHeader(value = "X-Tenant-Code", required = false) String tenantHeader,
        @RequestHeader(value = "X-Company-Id", required = false) Long companyHeader,
        @RequestParam(value = "tenantCode", required = false) String tenantParam,
        @RequestParam(value = "companyId", required = false) Long companyParam
    ) {
        try {
            String tenantCode = resolveTenantCode(tenantHeader, tenantParam);
            Long companyId = resolveCompanyId(companyHeader, companyParam);

            holidayService.deleteHoliday(id, tenantCode, companyId);
            return ResponseEntity.ok(ApiResponse.success("Holiday deleted", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/files")
    public ResponseEntity<ApiResponse<?>> getHolidayFiles(
        @RequestHeader(value = "X-Tenant-Code", required = false) String tenantHeader,
        @RequestHeader(value = "X-Company-Id", required = false) Long companyHeader,
        @RequestParam(value = "tenantCode", required = false) String tenantParam,
        @RequestParam(value = "companyId", required = false) Long companyParam
    ) {
        try {
            String tenantCode = resolveTenantCode(tenantHeader, tenantParam);
            Long companyId = resolveCompanyId(companyHeader, companyParam);

            var files = holidayService.getHolidayFiles(tenantCode, companyId);
            return ResponseEntity.ok(ApiResponse.success("Holiday files fetched", files));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/files/upload")
    public ResponseEntity<ApiResponse<?>> uploadHolidayFile(
        @RequestParam("file") MultipartFile file,
        @RequestHeader(value = "X-Tenant-Code", required = false) String tenantHeader,
        @RequestHeader(value = "X-Company-Id", required = false) Long companyHeader,
        @RequestParam(value = "tenantCode", required = false) String tenantParam,
        @RequestParam(value = "companyId", required = false) Long companyParam
    ) {
        try {
            String tenantCode = resolveTenantCode(tenantHeader, tenantParam);
            Long companyId = resolveCompanyId(companyHeader, companyParam);

            var saved = holidayService.uploadHolidayFile(file, tenantCode, companyId);
            return ResponseEntity.ok(ApiResponse.success("Holiday file uploaded", saved));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/files/{id}")
    public ResponseEntity<ApiResponse<?>> deleteHolidayFile(
        @PathVariable Long id,
        @RequestHeader(value = "X-Tenant-Code", required = false) String tenantHeader,
        @RequestHeader(value = "X-Company-Id", required = false) Long companyHeader,
        @RequestParam(value = "tenantCode", required = false) String tenantParam,
        @RequestParam(value = "companyId", required = false) Long companyParam
    ) {
        try {
            String tenantCode = resolveTenantCode(tenantHeader, tenantParam);
            Long companyId = resolveCompanyId(companyHeader, companyParam);

            holidayService.deleteHolidayFile(id, tenantCode, companyId);
            return ResponseEntity.ok(ApiResponse.success("Holiday file deleted", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    private String resolveTenantCode(String tenantHeader, String tenantParam) {
        String tenantCode = (tenantHeader != null && !tenantHeader.isBlank()) ? tenantHeader : tenantParam;
        if (tenantCode == null || tenantCode.isBlank()) {
            throw new RuntimeException("tenantCode is required");
        }
        return tenantCode;
    }

    private Long resolveCompanyId(Long companyHeader, Long companyParam) {
        Long companyId = (companyHeader != null) ? companyHeader : companyParam;
        if (companyId == null) {
            throw new RuntimeException("companyId is required");
        }
        return companyId;
    }
}
