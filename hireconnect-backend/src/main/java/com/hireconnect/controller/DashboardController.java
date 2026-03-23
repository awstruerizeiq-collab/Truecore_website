package com.hireconnect.controller;

import com.hireconnect.dto.response.ApiResponse;
import com.hireconnect.service.DashboardService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "*")
public class DashboardController {
    
	@Autowired
    private  DashboardService dashboardService;
    
    @GetMapping("/employee/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getEmployeeDashboard(@PathVariable Long id) {
        try {
            Map<String, Object> dashboard = dashboardService.getEmployeeDashboard(id);
            return ResponseEntity.ok(ApiResponse.success("Dashboard data fetched", dashboard));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/admin")  
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAdminDashboard() {
        try {
            Map<String, Object> dashboard = dashboardService.getAdminDashboard();
            return ResponseEntity.ok(ApiResponse.success("Admin dashboard fetched", dashboard));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboardStats() {
        try {
            Map<String, Object> stats = dashboardService.getDashboardStats();
            return ResponseEntity.ok(ApiResponse.success("Stats fetched", stats));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
     
}
