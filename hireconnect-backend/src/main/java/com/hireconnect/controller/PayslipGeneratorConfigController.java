package com.hireconnect.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hireconnect.dto.request.PayslipGeneratorConfigRequest;
import com.hireconnect.dto.response.ApiResponse;
import com.hireconnect.dto.response.PayslipGeneratorConfigResponse;
import com.hireconnect.service.PayslipGeneratorConfigService;

@RestController
@RequestMapping("/api/payslip-generator/config")
@CrossOrigin(origins = "*")
public class PayslipGeneratorConfigController {

    private final PayslipGeneratorConfigService payslipGeneratorConfigService;

    public PayslipGeneratorConfigController(PayslipGeneratorConfigService payslipGeneratorConfigService) {
        this.payslipGeneratorConfigService = payslipGeneratorConfigService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PayslipGeneratorConfigResponse>> saveOrUpdate(
        @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
        @RequestBody PayslipGeneratorConfigRequest request
    ) {
        try {
            PayslipGeneratorConfigResponse response =
                payslipGeneratorConfigService.saveOrUpdate(authorizationHeader, request);
            return ResponseEntity.ok(ApiResponse.success("Payslip generator configuration saved.", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/{companyId}")
    public ResponseEntity<ApiResponse<PayslipGeneratorConfigResponse>> getByCompany(
        @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
        @PathVariable Long companyId
    ) {
        try {
            PayslipGeneratorConfigResponse response =
                payslipGeneratorConfigService.getByCompanyId(authorizationHeader, companyId);
            return ResponseEntity.ok(ApiResponse.success("Payslip generator configuration fetched.", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}