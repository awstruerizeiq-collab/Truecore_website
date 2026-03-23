package com.hireconnect.controller;

import com.hireconnect.dto.response.ApiResponse;
import com.hireconnect.entity.Reimbursement;
import com.hireconnect.entity.TaxDeclaration;
import com.hireconnect.service.FinanceService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/finance")
@CrossOrigin(origins = "*")
public class FinanceController {
    
	@Autowired
    private  FinanceService financeService;
    
    
    @GetMapping("/reimbursements")
    public ResponseEntity<ApiResponse<List<Reimbursement>>> getReimbursements() {
        try {
            List<Reimbursement> reimbursements = financeService.getReimbursements();
            return ResponseEntity.ok(ApiResponse.success("Reimbursements fetched", reimbursements));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/reimbursements/all")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','CEO')")
    public ResponseEntity<ApiResponse<List<Reimbursement>>> getAllReimbursements() {
        try {
            List<Reimbursement> reimbursements = financeService.getAllReimbursements();
            return ResponseEntity.ok(ApiResponse.success("All reimbursements fetched", reimbursements));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PostMapping("/reimbursements")
    public ResponseEntity<ApiResponse<Reimbursement>> createReimbursement(@RequestBody Reimbursement reimbursement) {
        try {
            Reimbursement created = financeService.createReimbursement(reimbursement);
            return ResponseEntity.ok(ApiResponse.success("Reimbursement created", created));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PutMapping("/reimbursements/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','CEO')")
    public ResponseEntity<ApiResponse<String>> approveReimbursement(
            @PathVariable Long id,
            @RequestBody Map<String, Long> request) {
        try {
            Long approvedBy = request == null ? null : request.get("approvedBy");
            if (approvedBy == null) {
                approvedBy = financeService.getCurrentUserId();
            }
            financeService.approveReimbursement(id, approvedBy);
            return ResponseEntity.ok(ApiResponse.success("Reimbursement approved", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PutMapping("/reimbursements/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','CEO')")
    public ResponseEntity<ApiResponse<String>> rejectReimbursement(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request) {
        try {
            Object approvedByRaw = request == null ? null : request.get("approvedBy");
            Long approvedBy = approvedByRaw == null
                ? financeService.getCurrentUserId()
                : Long.parseLong(approvedByRaw.toString());
            String reason = request == null ? null : (String) request.getOrDefault("reason", request.get("rejectionReason"));
            financeService.rejectReimbursement(id, approvedBy, reason);
            return ResponseEntity.ok(ApiResponse.success("Reimbursement rejected", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PutMapping("/reimbursements/{id}/mark-paid")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','CEO')")
    public ResponseEntity<ApiResponse<String>> markReimbursementAsPaid(@PathVariable Long id) {
        try {
            financeService.markReimbursementAsPaid(id);
            return ResponseEntity.ok(ApiResponse.success("Reimbursement marked as paid", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    
    @GetMapping("/tax-declarations")
    public ResponseEntity<ApiResponse<List<TaxDeclaration>>> getTaxDeclarations() {
        try {
            List<TaxDeclaration> declarations = financeService.getTaxDeclarations();
            return ResponseEntity.ok(ApiResponse.success("Tax declarations fetched", declarations));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/tax-declarations/all")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','CEO')")
    public ResponseEntity<ApiResponse<List<TaxDeclaration>>> getAllTaxDeclarations() {
        try {
            List<TaxDeclaration> declarations = financeService.getAllTaxDeclarations();
            return ResponseEntity.ok(ApiResponse.success("All tax declarations fetched", declarations));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PostMapping("/tax-declarations")
    public ResponseEntity<ApiResponse<TaxDeclaration>> createTaxDeclaration(@RequestBody TaxDeclaration taxDeclaration) {
        try {
            TaxDeclaration created = financeService.createTaxDeclaration(taxDeclaration);
            return ResponseEntity.ok(ApiResponse.success("Tax declaration created", created));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PutMapping("/tax-declarations/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','CEO')")
    public ResponseEntity<ApiResponse<String>> approveTaxDeclaration(
            @PathVariable Long id,
            @RequestBody Map<String, Long> request) {
        try {
            Long approvedBy = request.get("approvedBy");
            if (approvedBy == null) {
                approvedBy = financeService.getCurrentUserId();
            }
            financeService.approveTaxDeclaration(id, approvedBy);
            return ResponseEntity.ok(ApiResponse.success("Tax declaration approved", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PutMapping("/tax-declarations/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','CEO')")
    public ResponseEntity<ApiResponse<String>> rejectTaxDeclaration(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request) {
        try {
            Object approvedByRaw = request.get("approvedBy");
            Long approvedBy = approvedByRaw == null
                ? financeService.getCurrentUserId()
                : Long.parseLong(approvedByRaw.toString());
            String reason = (String) request.get("reason");
            financeService.rejectTaxDeclaration(id, approvedBy, reason);
            return ResponseEntity.ok(ApiResponse.success("Tax declaration rejected", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
