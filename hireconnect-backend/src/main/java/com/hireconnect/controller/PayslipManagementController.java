package com.hireconnect.controller;

import com.hireconnect.dto.request.PayslipBulkGenerateRequest;
import com.hireconnect.dto.response.ApiResponse;
import com.hireconnect.dto.response.PayslipManagementItemResponse;
import com.hireconnect.service.PayrollService;
import com.hireconnect.service.PayslipManagementService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payslips/management")
@CrossOrigin(origins = "*")
public class PayslipManagementController {

    private final PayslipManagementService payslipManagementService;
    private final PayrollService payrollService;

    public PayslipManagementController(
            PayslipManagementService payslipManagementService,
            PayrollService payrollService
    ) {
        this.payslipManagementService = payslipManagementService;
        this.payrollService = payrollService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PayslipManagementItemResponse>>> list(
            @RequestHeader(value = "X-Company-Id", required = false) Long companyHeader,
            @RequestParam(value = "companyId", required = false) Long companyParam,
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "month", required = false) String month
    ) {
        try {
            Long companyId = resolveCompanyId(companyHeader, companyParam);
            List<PayslipManagementItemResponse> items =
                    payslipManagementService.listByCompany(companyId, search, month);
            return ResponseEntity.ok(ApiResponse.success("Payslip records fetched", items));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/{payrollId}/generate")
    public ResponseEntity<ApiResponse<PayslipManagementItemResponse>> generateOne(
            @PathVariable Long payrollId,
            @RequestHeader(value = "X-Company-Id", required = false) Long companyHeader,
            @RequestParam(value = "companyId", required = false) Long companyParam
    ) {
        try {
            Long companyId = resolveCompanyId(companyHeader, companyParam);
            PayslipManagementItemResponse item = payslipManagementService.generateOne(companyId, payrollId);
            return ResponseEntity.ok(ApiResponse.success("Payslip generated successfully", item));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/generate-bulk")
    public ResponseEntity<ApiResponse<Map<String, Object>>> generateBulk(
            @RequestHeader(value = "X-Company-Id", required = false) Long companyHeader,
            @RequestParam(value = "companyId", required = false) Long companyParam,
            @RequestBody PayslipBulkGenerateRequest request
    ) {
        try {
            Long companyId = resolveCompanyId(companyHeader, companyParam);
            int generated = payslipManagementService.generateBulk(companyId, request.getPayrollIds());
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("generatedCount", generated);
            payload.put("requestedCount", request.getPayrollIds() == null ? 0 : request.getPayrollIds().size());
            return ResponseEntity.ok(ApiResponse.success("Bulk payslip generation completed", payload));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/{payrollId}/preview")
    public ResponseEntity<?> preview(@PathVariable Long payrollId) {
        try {
            return payrollService.previewPayslip(payrollId);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/{payrollId}/download")
    public ResponseEntity<?> download(@PathVariable Long payrollId) {
        try {
            return payrollService.downloadPayslip(payrollId);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    private Long resolveCompanyId(Long companyHeader, Long companyParam) {
        Long companyId = companyHeader != null ? companyHeader : companyParam;
        if (companyId == null) {
            throw new RuntimeException("companyId is required");
        }
        return companyId;
    }
}

