package com.hireconnect.controller;

import com.hireconnect.dto.request.FinanceDecisionRequest;
import com.hireconnect.dto.response.ApiResponse;
import com.hireconnect.dto.response.FinanceDecisionResponse;
import com.hireconnect.dto.response.FinanceOverviewRowDto;
import com.hireconnect.service.AdminFinanceOverviewService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/admin/finance-overview")
@CrossOrigin(origins = "*")
public class AdminFinanceOverviewController {

    private final AdminFinanceOverviewService service;

    public AdminFinanceOverviewController(AdminFinanceOverviewService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<FinanceOverviewRowDto>>> getOverview(
            @RequestParam String tenantCode,
            @RequestParam(required = false) Long companyId,
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate
    ) {
        List<FinanceOverviewRowDto> rows = service.getOverview(tenantCode, companyId, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success("Finance overview fetched", rows));
    }

    @PostMapping("/decision")
    public ResponseEntity<ApiResponse<FinanceDecisionResponse>> applyDecision(
            @RequestBody FinanceDecisionRequest request
    ) {
        FinanceDecisionResponse response = service.applyDecision(request);
        return ResponseEntity.ok(ApiResponse.success("Decision applied", response));
    }
}