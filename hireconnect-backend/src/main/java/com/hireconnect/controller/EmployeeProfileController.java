package com.hireconnect.controller;

import com.hireconnect.dto.request.FullEmployeeProfileRequest;
import com.hireconnect.service.EmployeeProfileService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/employees")
@CrossOrigin(origins = "*")
public class EmployeeProfileController {

    @Autowired
    private EmployeeProfileService employeeProfileService;

    @PostMapping("/full-profile")
    public ResponseEntity<Map<String, Object>> createFullProfile(@Valid @RequestBody FullEmployeeProfileRequest request) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long userId = employeeProfileService.createFullProfile(request);
            response.put("success", true);
            response.put("message", "Employee full profile saved successfully");
            response.put("userId", userId);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}