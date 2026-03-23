package com.hireconnect.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hireconnect.dto.request.GlobalAdminLoginRequest;
import com.hireconnect.dto.request.GlobalAdminRegisterRequest;
import com.hireconnect.dto.request.GlobalAdminUpdateRequest;
import com.hireconnect.dto.response.ApiResponse;
import com.hireconnect.dto.response.GlobalAdminAuthResponse;
import com.hireconnect.service.GlobalAdminAuthService;

@RestController
@RequestMapping("/api/global-admin/auth")
@CrossOrigin(origins = "*")
public class GlobalAdminAuthController {

    private final GlobalAdminAuthService service;

    public GlobalAdminAuthController(GlobalAdminAuthService service) {
        this.service = service;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<GlobalAdminAuthResponse>> register(
            @RequestBody GlobalAdminRegisterRequest request) {
        try {
            GlobalAdminAuthResponse response = service.register(request);
            return ResponseEntity.ok(ApiResponse.success("Global admin registered", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<GlobalAdminAuthResponse>> login(
            @RequestBody GlobalAdminLoginRequest request) {
        try {
            GlobalAdminAuthResponse response = service.login(request);
            return ResponseEntity.ok(ApiResponse.success("Login success", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ✅ READ ALL
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<GlobalAdminAuthResponse>>> getAllGlobalAdmins() {
        try {
            List<GlobalAdminAuthResponse> list = service.getAllGlobalAdmins();
            return ResponseEntity.ok(ApiResponse.success("Global admins fetched", list));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ✅ READ ONE
    @GetMapping("/users/{id}")
    public ResponseEntity<ApiResponse<GlobalAdminAuthResponse>> getOne(@PathVariable Long id) {
        try {
            GlobalAdminAuthResponse data = service.getById(id);
            return ResponseEntity.ok(ApiResponse.success("Global admin fetched", data));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ✅ UPDATE
    @PutMapping("/users/{id}")
    public ResponseEntity<ApiResponse<GlobalAdminAuthResponse>> update(
            @PathVariable Long id,
            @RequestBody GlobalAdminUpdateRequest request) {
        try {
            GlobalAdminAuthResponse data = service.update(id, request);
            return ResponseEntity.ok(ApiResponse.success("Global admin updated", data));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ✅ DELETE
    @DeleteMapping("/users/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        try {
            service.delete(id);
            return ResponseEntity.ok(ApiResponse.success("Global admin deleted", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

}