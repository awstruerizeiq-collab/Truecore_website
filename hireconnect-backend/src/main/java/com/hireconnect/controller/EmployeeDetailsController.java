package com.hireconnect.controller;

import com.hireconnect.dto.request.EmployeeDetailsDto;
import com.hireconnect.service.EmployeeDetailsService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/employee-details")
@CrossOrigin(origins = "*")
public class EmployeeDetailsController {

    @Autowired
    private EmployeeDetailsService service;

    @PostMapping
    public ResponseEntity<Map<String, Object>> create(@Valid @RequestBody EmployeeDetailsDto dto) {
        Map<String, Object> res = new HashMap<>();
        try {
            res.put("success", true);
            res.put("message", "Employee details created successfully");
            res.put("data", service.create(dto));
            return ResponseEntity.status(HttpStatus.CREATED).body(res);
        } catch (Exception e) {
            res.put("success", false);
            res.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(res);
        }
    }

    @PutMapping("/{tenantCode}/{employeeId}")
    public ResponseEntity<Map<String, Object>> update(
            @PathVariable String tenantCode,
            @PathVariable String employeeId,
            @Valid @RequestBody EmployeeDetailsDto dto
    ) {
        Map<String, Object> res = new HashMap<>();
        try {
            res.put("success", true);
            res.put("message", "Employee details updated successfully");
            res.put("data", service.update(tenantCode, employeeId, dto));
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            res.put("success", false);
            res.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(res);
        }
    }

    @GetMapping("/{tenantCode}/{employeeId}")
    public ResponseEntity<Map<String, Object>> getOne(
            @PathVariable String tenantCode,
            @PathVariable String employeeId
    ) {
        Map<String, Object> res = new HashMap<>();
        try {
            res.put("success", true);
            res.put("data", service.getOne(tenantCode, employeeId));
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            res.put("success", false);
            res.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(res);
        }
    }

    @GetMapping("/tenant/{tenantCode}")
    public ResponseEntity<Map<String, Object>> getByTenant(@PathVariable String tenantCode) {
        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("data", service.getByTenant(tenantCode));
        return ResponseEntity.ok(res);
    }

    @DeleteMapping("/{tenantCode}/{employeeId}")
    public ResponseEntity<Map<String, Object>> delete(
            @PathVariable String tenantCode,
            @PathVariable String employeeId
    ) {
        Map<String, Object> res = new HashMap<>();
        try {
            service.delete(tenantCode, employeeId);
            res.put("success", true);
            res.put("message", "Employee deleted successfully");
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            res.put("success", false);
            res.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(res);
        }
    }

    @GetMapping("/tenant/{tenantCode}/designation/{designation}")
    public ResponseEntity<Map<String, Object>> getByTenantAndDesignation(
            @PathVariable String tenantCode,
            @PathVariable String designation
    ) {
        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("data", service.getByTenantAndDesignation(tenantCode, designation));
        return ResponseEntity.ok(res);
    }

    @GetMapping("/team-lead/{tenantCode}/{teamLeadEmployeeId}")
    public ResponseEntity<Map<String, Object>> getTeamMembersByTeamLead(
            @PathVariable String tenantCode,
            @PathVariable String teamLeadEmployeeId
    ) {
        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("data", service.getTeamMembersByTeamLead(tenantCode, teamLeadEmployeeId));
        return ResponseEntity.ok(res);
    }
}