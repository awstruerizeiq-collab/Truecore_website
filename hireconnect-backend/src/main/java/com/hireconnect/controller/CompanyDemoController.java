package com.hireconnect.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.hireconnect.dto.request.CompanyDemoLoginRequest;
import com.hireconnect.dto.request.CompanyDemoRequest;
import com.hireconnect.dto.request.CompanyDemoUpdateRequest;
import com.hireconnect.dto.request.CompanyRegistrationLoginRequest;
import com.hireconnect.dto.request.CompanyRegistrationRequest;
import com.hireconnect.dto.response.ApiResponse;
import com.hireconnect.dto.response.CompanyDemoResponse;
import com.hireconnect.dto.response.CompanyRegistrationResponse;
import com.hireconnect.service.CompanyDemoService;

@RestController
@RequestMapping("/api/company")
@CrossOrigin(origins = {"http://localhost:3001", "http://localhost:5173", "http://127.0.0.1:3001", "https://app.truecorehr.com"})
public class CompanyDemoController {
    
	@Autowired
    private  CompanyDemoService companyDemoService;
 
     
    public CompanyDemoController(CompanyDemoService companyDemoService) {
        this.companyDemoService = companyDemoService;
    }
    

    @PostMapping("/demo-register")
    public ResponseEntity<ApiResponse<CompanyDemoResponse>> register(@RequestBody CompanyDemoRequest request) {
        try {
            CompanyDemoResponse response = companyDemoService.register(request);
            return ResponseEntity.ok(ApiResponse.success("Demo Company registered successfully", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PostMapping("/company-register")
    public ResponseEntity<ApiResponse<CompanyRegistrationResponse>> register(@RequestBody CompanyRegistrationRequest request) {
        try {
            CompanyRegistrationResponse response = companyDemoService.registerCompany(request);
            return ResponseEntity.ok(ApiResponse.success("Company registered successfully", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<CompanyDemoResponse>> login(@RequestBody CompanyDemoLoginRequest request) {
        try {
            CompanyDemoResponse response = companyDemoService.login(request);
            return ResponseEntity.ok(ApiResponse.success("Login successful", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    

    @GetMapping("/companies")
    public ResponseEntity<ApiResponse<List<CompanyDemoResponse>>> getAllCompanies() {
        try {
            List<CompanyDemoResponse> companies = companyDemoService.getAllCompanies();
            return ResponseEntity.ok(ApiResponse.success("Companies fetched successfully", companies));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PostMapping("/company-login")
    public ResponseEntity<ApiResponse<CompanyRegistrationResponse>> loginRegisteredCompany(
            @RequestBody CompanyRegistrationLoginRequest request) {
        try {
            CompanyRegistrationResponse response = companyDemoService.loginRegisteredCompany(request);
            return ResponseEntity.ok(ApiResponse.success("Login successful", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    

    @GetMapping("/companies/{id}")
    public ResponseEntity<ApiResponse<CompanyDemoResponse>> getCompanyById(@PathVariable Long id) {
        try {
            CompanyDemoResponse company = companyDemoService.getCompanyById(id);
            return ResponseEntity.ok(ApiResponse.success("Company fetched successfully", company));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    

    @GetMapping("/companies/status/{status}")
    public ResponseEntity<ApiResponse<List<CompanyDemoResponse>>> getCompaniesByStatus(@PathVariable String status) {
        try {
            List<CompanyDemoResponse> companies = companyDemoService.getCompaniesByStatus(status);
            return ResponseEntity.ok(ApiResponse.success("Companies fetched successfully", companies));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    

    @GetMapping("/companies/search")
    public ResponseEntity<ApiResponse<List<CompanyDemoResponse>>> searchCompanies(
            @RequestParam String companyName) {
        try {
            List<CompanyDemoResponse> companies = companyDemoService.searchCompaniesByName(companyName);
            return ResponseEntity.ok(ApiResponse.success("Companies fetched successfully", companies));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    

    @PutMapping("/companies/{id}")
    public ResponseEntity<ApiResponse<CompanyDemoResponse>> updateCompany(
            @PathVariable Long id,
            @RequestBody CompanyDemoUpdateRequest request) {
        try {
            CompanyDemoResponse response = companyDemoService.updateCompany(id, request);
            return ResponseEntity.ok(ApiResponse.success("Company updated successfully", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    

    @PutMapping("/companies/{id}/status")
    public ResponseEntity<ApiResponse<CompanyDemoResponse>> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        try {
            String status = body.get("status");
            String remarks = body.get("remarks");
            CompanyDemoResponse response = companyDemoService.updateStatus(id, status, remarks);
            return ResponseEntity.ok(ApiResponse.success("Status updated successfully", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    

    @DeleteMapping("/companies/{id}")
    public ResponseEntity<ApiResponse<String>> deleteCompany(@PathVariable Long id) {
        try {
            companyDemoService.deleteCompany(id);
            return ResponseEntity.ok(ApiResponse.success("Company deleted successfully", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    

    @GetMapping("/statistics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStatistics() {
        try {
            Map<String, Object> stats = companyDemoService.getStatistics();
            return ResponseEntity.ok(ApiResponse.success("Statistics fetched successfully", stats));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
