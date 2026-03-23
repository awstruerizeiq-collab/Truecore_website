package com.hireconnect.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.core.io.Resource;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hireconnect.dto.request.CompanyLoginRequest;
import com.hireconnect.entity.Company;
import com.hireconnect.service.AuthService;
import com.hireconnect.service.CompanyService;

@RestController
@RequestMapping({"/api/global-admin/companies", "/api/companies"})
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.PATCH, RequestMethod.OPTIONS})
public class CompanyController {

    @Autowired
    private CompanyService service;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AuthService authService;

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> create(@RequestBody Company company) {
        Map<String, Object> response = new HashMap<>();
        try {
            Company savedCompany = service.createCompany(company);
            response.put("success", true);
            response.put("message", "Company created successfully");
            response.put("data", savedCompany);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> createMultipart(
            @RequestPart("company") String companyJson,
            @RequestPart(value = "logo", required = false) MultipartFile logo
    ) {
        Map<String, Object> response = new HashMap<>();
        try {
            Company company = objectMapper.readValue(companyJson, Company.class);
            Company savedCompany = service.createCompany(company, logo);
            response.put("success", true);
            response.put("message", "Company created successfully");
            response.put("data", savedCompany);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAll() {
        Map<String, Object> response = new HashMap<>();
        try {
            List<Company> companies = service.getAll();
            response.put("success", true);
            response.put("message", "Companies fetched successfully");
            response.put("data", companies);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> get(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            Company company = service.getById(id);
            response.put("success", true);
            response.put("message", "Company fetched successfully");
            response.put("data", company);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }

    @GetMapping("/{id}/logo")
    public ResponseEntity<Resource> getLogo(@PathVariable Long id) {
        try {
            return service.getCompanyLogo(id);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> update(@PathVariable Long id,
                                                       @RequestBody Company company) {
        Map<String, Object> response = new HashMap<>();
        try {
            Company updatedCompany = service.update(id, company);
            response.put("success", true);
            response.put("message", "Company updated successfully");
            response.put("data", updatedCompany);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> delete(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            service.delete(id);
            response.put("success", true);
            response.put("message", "Company deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }

    @PatchMapping("/{id}/toggle-status")
    public ResponseEntity<Map<String, Object>> toggle(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            Company company = service.toggleStatus(id);
            response.put("success", true);
            response.put("message", "Company status toggled successfully");
            response.put("data", company);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }

    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> search(@RequestParam String searchTerm) {
        Map<String, Object> response = new HashMap<>();
        try {
            List<Company> companies = service.searchCompanies(searchTerm);
            response.put("success", true);
            response.put("message", "Search completed successfully");
            response.put("data", companies);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<Map<String, Object>> getByStatus(@PathVariable String status) {
        Map<String, Object> response = new HashMap<>();
        try {
            List<Company> companies = service.getCompaniesByStatus(status);
            response.put("success", true);
            response.put("message", "Companies fetched successfully");
            response.put("data", companies);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getStatistics() {
        Map<String, Object> response = new HashMap<>();
        try {
            Map<String, Object> stats = service.getStatistics();
            response.put("success", true);
            response.put("message", "Statistics fetched successfully");
            response.put("data", stats);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    /**
     * Backward-compatible company login endpoint.
     */
    @PostMapping("/company-login")
    public ResponseEntity<Map<String, Object>> companyLogin(@RequestBody Map<String, String> loginRequest) {
        Map<String, Object> response = new HashMap<>();
        try {
            CompanyLoginRequest req = new CompanyLoginRequest();
            req.setTenantCode(loginRequest.get("tenantCode"));
            req.setCompanyOfficialEmail(
                    loginRequest.getOrDefault("companyOfficialEmail", loginRequest.get("officialEmail"))
            );
            req.setCompanyOfficialPassword(loginRequest.get("companyOfficialPassword"));

            Map<String, Object> companyData = authService.companyLogin(req);
            response.put("success", true);
            response.put("message", "Company login successful");
            response.put("data", companyData);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            response.put("success", false);
            response.put("message", "Invalid credentials");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Invalid credentials");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }
}
