package com.hireconnect.controller;

import com.hireconnect.dto.request.GrossSalaryDetailsDto;
import com.hireconnect.service.GrossSalaryDetailsService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/gross-salary-details")
@CrossOrigin(origins = "*")
public class GrossSalaryDetailsController {

    @Autowired
    private GrossSalaryDetailsService service;

    @PostMapping
    public ResponseEntity<Map<String, Object>> create(@Valid @RequestBody GrossSalaryDetailsDto dto) {
        Map<String, Object> res = new HashMap<>();
        try {
            res.put("success", true);
            res.put("message", "Gross salary details created successfully");
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
        @Valid @RequestBody GrossSalaryDetailsDto dto
    ) {
        Map<String, Object> res = new HashMap<>();
        try {
            res.put("success", true);
            res.put("message", "Gross salary details updated successfully");
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
            res.put("message", "Gross salary details deleted successfully");
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            res.put("success", false);
            res.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(res);
        }
    }
}