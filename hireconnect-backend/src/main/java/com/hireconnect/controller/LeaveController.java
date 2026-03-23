package com.hireconnect.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hireconnect.dto.response.ApiResponse;
import com.hireconnect.entity.Leave;
import com.hireconnect.service.LeaveService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/leaves")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class LeaveController {
	@Autowired
    private  LeaveService leaveService;
    
    @GetMapping("/my-leaves")
    public ResponseEntity<ApiResponse<List<Leave>>> getMyLeaves() {
        try {
            List<Leave> leaves = leaveService.getMyLeaves();
            return ResponseEntity.ok(ApiResponse.success("Leaves fetched", leaves));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ApiResponse<List<Leave>>> getAllLeaves() {
        try {
            List<Leave> leaves = leaveService.getAllLeaves();
            return ResponseEntity.ok(ApiResponse.success("All leaves fetched", leaves));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/pending")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ApiResponse<List<Leave>>> getPendingLeaves() {
        try {
            List<Leave> leaves = leaveService.getPendingLeaves();
            return ResponseEntity.ok(ApiResponse.success("Pending leaves fetched", leaves));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Leave>> getLeaveById(@PathVariable Long id) {
        try {
            Leave leave = leaveService.getLeaveById(id);
            return ResponseEntity.ok(ApiResponse.success("Leave fetched", leave));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PostMapping("/apply")
    public ResponseEntity<ApiResponse<Leave>> applyLeave(@RequestBody Leave leave) {
        try {
            Leave created = leaveService.applyLeave(leave);
            return ResponseEntity.ok(ApiResponse.success("Leave applied successfully", created));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ApiResponse<Leave>> approveLeave(
            @PathVariable Long id,
            @RequestBody Map<String, Long> request) {
        try {
            Long reviewedBy = request.get("reviewedBy");
            Leave approved = leaveService.approveLeave(id, reviewedBy);
            return ResponseEntity.ok(ApiResponse.success("Leave approved", approved));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PutMapping("/{id}/reject")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ApiResponse<Leave>> rejectLeave(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request) {
        try {
            Long reviewedBy = Long.parseLong(request.get("reviewedBy").toString());
            String reason = (String) request.get("reason");
            Leave rejected = leaveService.rejectLeave(id, reviewedBy, reason);
            return ResponseEntity.ok(ApiResponse.success("Leave rejected", rejected));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteLeave(@PathVariable Long id) {
        try {
            leaveService.deleteLeave(id);
            return ResponseEntity.ok(ApiResponse.success("Leave deleted", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ApiResponse<List<Leave>>> getLeavesByUserId(@PathVariable Long userId) {
        try {
            List<Leave> leaves = leaveService.getLeavesByUserId(userId);
            return ResponseEntity.ok(ApiResponse.success("User leaves fetched", leaves));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}