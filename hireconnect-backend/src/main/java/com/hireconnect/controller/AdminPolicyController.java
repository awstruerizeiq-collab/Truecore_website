package com.hireconnect.controller;

import java.io.IOException;
import java.util.List;

import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.hireconnect.entity.AdminPolicy;
import com.hireconnect.service.AdminPolicyService;

@RestController
@RequestMapping("/api/policies")
@CrossOrigin(
	    origins = {"http://localhost:5173", "http://localhost:3000", "https://app.truecorehr.com"},
	    allowCredentials = "true"
	)
public class AdminPolicyController {
    
    private AdminPolicyService service;
    
    public AdminPolicyController(AdminPolicyService service) {
        this.service = service;
    }
    
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> create(
            @RequestParam("title") String title,
            @RequestParam("description") String description,
            @RequestParam("tenantCode") String tenantCode,
            @RequestParam(value = "file", required = false) MultipartFile file) {
        
        try {
            // Validate tenant code
            if (tenantCode == null || tenantCode.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Tenant code is required");
            }
            
            AdminPolicy policy = new AdminPolicy();
            policy.setTitle(title);
            policy.setDescription(description);
            policy.setTenantCode(tenantCode.trim());
            
            AdminPolicy savedPolicy = service.save(policy, file);
            return ResponseEntity.ok(savedPolicy);
            
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to save policy: " + e.getMessage());
        }
    }
    
    // Get policies by tenant code
    @GetMapping("/tenant/{tenantCode}")
    public ResponseEntity<?> getByTenant(@PathVariable String tenantCode) {
        if (tenantCode == null || tenantCode.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Tenant code is required");
        }
        
        List<AdminPolicy> policies = service.getAllByTenant(tenantCode.trim());
        return ResponseEntity.ok(policies);
    }
    
    // Admin only - get all policies
    @GetMapping("/admin/all")
    public List<AdminPolicy> all() {
        return service.getAll();
    }
    
    // View file inline (for PDFs and images) - with tenant validation
    @GetMapping("/view/{tenantCode}/{filename}")
    public ResponseEntity<Resource> viewFile(
            @PathVariable String tenantCode,
            @PathVariable String filename) throws IOException {
        return service.viewFile(tenantCode, filename);
    }
    
    // Download file - with tenant validation
    @GetMapping("/download/{tenantCode}/{filename}")
    public ResponseEntity<Resource> downloadFile(
            @PathVariable String tenantCode,
            @PathVariable String filename) throws IOException {
        return service.downloadFile(tenantCode, filename);
    }
}
