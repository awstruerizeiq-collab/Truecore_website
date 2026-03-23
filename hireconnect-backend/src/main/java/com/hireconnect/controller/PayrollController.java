package com.hireconnect.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
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

import com.hireconnect.dto.request.PayrollRequest;
import com.hireconnect.dto.response.ApiResponse;
import com.hireconnect.dto.response.PayrollResponse;
import com.hireconnect.entity.PayrollHistory;
import com.hireconnect.service.PayrollService;

@RestController
@RequestMapping("/api/payroll")
@CrossOrigin(origins = "*")
public class PayrollController {
    
    @Autowired
    private PayrollService payrollService;
    
    
    @GetMapping
    public ResponseEntity<ApiResponse<List<PayrollResponse>>> getAllPayrolls(
            @RequestHeader(value = "X-Company-Id", required = false) Long companyHeader,
            @RequestParam(value = "companyId", required = false) Long companyParam) {
        try {
            Long companyId = resolveCompanyId(companyHeader, companyParam);
            List<PayrollResponse> payrolls = payrollService.getAllPayrollsByCompany(companyId);
            return ResponseEntity.ok(ApiResponse.success("Payrolls fetched", payrolls));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PayrollResponse>> getPayrollById(
            @PathVariable Long id,
            @RequestHeader(value = "X-Company-Id", required = false) Long companyHeader,
            @RequestParam(value = "companyId", required = false) Long companyParam) {
        try {
            Long companyId = resolveCompanyId(companyHeader, companyParam);
        	PayrollResponse payroll = payrollService.getPayrollById(id, companyId);
            return ResponseEntity.ok(ApiResponse.success("Payroll fetched", payroll));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    // 🔥 UPDATED: Return PayrollDTO with user details
    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<PayrollResponse>>> getPayrollByUser(
            @PathVariable Long userId,
            @RequestHeader(value = "X-Company-Id", required = false) Long companyHeader,
            @RequestParam(value = "companyId", required = false) Long companyParam) {
        try {
            Long companyId = resolveCompanyId(companyHeader, companyParam);
            List<PayrollResponse> payrolls = payrollService.getPayrollByUser(userId, companyId);
            return ResponseEntity.ok(ApiResponse.success("User payrolls fetched", payrolls));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PostMapping
    public ResponseEntity<ApiResponse<PayrollHistory>> createPayroll(@RequestBody PayrollRequest request) {
        try {
            PayrollHistory payroll = payrollService.createPayroll(request);
            return ResponseEntity.ok(ApiResponse.success("Payroll created", payroll));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PayrollHistory>> updatePayroll(
            @PathVariable Long id,
            @RequestBody PayrollRequest request) {
        try {
            PayrollHistory payroll = payrollService.updatePayroll(id, request);
            return ResponseEntity.ok(ApiResponse.success("Payroll updated", payroll));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deletePayroll(@PathVariable Long id) {
        try {
            payrollService.deletePayroll(id);
            return ResponseEntity.ok(ApiResponse.success("Payroll deleted", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PostMapping("/generate-auto")
    public ResponseEntity<ApiResponse<PayrollHistory>> generateAutoPayroll(@RequestBody PayrollRequest request) {
        try {
            PayrollHistory payroll = payrollService.generateAutoPayroll(request);
            return ResponseEntity.ok(ApiResponse.success("Auto payroll generated", payroll));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PostMapping("/manual-entry")
    public ResponseEntity<ApiResponse<PayrollHistory>> manualPayrollEntry(@RequestBody PayrollRequest request) {
        try {
            PayrollHistory payroll = payrollService.manualPayrollEntry(request);
            return ResponseEntity.ok(ApiResponse.success("Manual payroll created", payroll));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/auto-entry")
    public ResponseEntity<ApiResponse<PayrollHistory>> autoPayrollEntry(@RequestBody PayrollRequest request) {
        try {
            PayrollHistory payroll = payrollService.autoPayrollEntry(request);
            return ResponseEntity.ok(ApiResponse.success("Auto payroll created", payroll));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/analytics")
    public ResponseEntity<ApiResponse<?>> getAnalytics(@RequestParam(defaultValue = "6months") String range) {
        try {
            var analytics = payrollService.getAnalytics(range);
            return ResponseEntity.ok(ApiResponse.success("Analytics fetched", analytics));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/export")
    public ResponseEntity<?> exportPayrolls(
            @RequestParam(defaultValue = "xlsx") String format,
            @RequestParam(defaultValue = "all") String status,
            @RequestParam(defaultValue = "all") String month) {
        try {
            return payrollService.exportPayrolls(format, status, month);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PostMapping("/{id}/generate-payslip")
    public ResponseEntity<ApiResponse<?>> generatePayslip(@PathVariable Long id) {
        try {
            var result = payrollService.generatePayslip(id);
            return ResponseEntity.ok(ApiResponse.success("Payslip generated", result));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/{id}/download-payslip")
    public ResponseEntity<?> downloadPayslip(@PathVariable Long id) {
        try {
            return payrollService.downloadPayslip(id);
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