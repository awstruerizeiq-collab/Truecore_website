package com.hireconnect.controller;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hireconnect.dto.request.CompanyLoginRequest;
import com.hireconnect.dto.request.ForgotPasswordRequest;
import com.hireconnect.dto.request.LoginRequest;
import com.hireconnect.dto.request.RegisterRequest;
import com.hireconnect.dto.request.ResetPasswordRequest;
import com.hireconnect.dto.response.ApiResponse;
import com.hireconnect.dto.response.AuthResponse;
import com.hireconnect.repository.EmployeeDetailsRepository;
import com.hireconnect.repository.UserRepository;
import com.hireconnect.service.AuthService;
import com.hireconnect.util.JwtUtil;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmployeeDetailsRepository employeeDetailsRepository;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@RequestBody RegisterRequest request) {
        try {
            AuthResponse response = authService.register(request);
            return ResponseEntity.ok(ApiResponse.success("Registration successful", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(ApiResponse.success("Login successful", response));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Login failed"));
        }
    }

    @PostMapping("/company-login")
    public ResponseEntity<ApiResponse<Map<String, Object>>> companyLogin(@RequestBody CompanyLoginRequest request) {
        try {
            Map<String, Object> data = authService.companyLogin(request);
            return ResponseEntity.ok(ApiResponse.success("Company login successful", data));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Invalid credentials"));
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<String>> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        try {
            authService.forgotPassword(request);
            return ResponseEntity.ok(
                    ApiResponse.success(
                            "Password reset link has been sent to your email if the account exists.",
                            null
                    )
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<String>> resetPassword(@RequestBody ResetPasswordRequest request) {
        try {
            authService.resetPassword(request);
            return ResponseEntity.ok(ApiResponse.success("Password reset successful", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/validate")
    public ResponseEntity<ApiResponse<String>> validateToken() {
        return ResponseEntity.ok(ApiResponse.success("Token is valid", null));
    }

    @GetMapping("/dashboard-switch/employee")
    public ResponseEntity<ApiResponse<Map<String, Object>>> canSwitchToEmployeeDashboard(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader) {
        String token = extractBearerToken(authorizationHeader);
        if (token.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Authorization token is required"));
        }

        final String email;
        try {
            email = jwtUtil.extractUsername(token);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Invalid or expired token"));
        }

        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Invalid token subject"));
        }

        String role = resolveRoleForSwitch(email.trim().toLowerCase(Locale.ROOT));
        boolean allowed = isAllowedSwitchRole(role);

        Map<String, Object> data = new HashMap<>();
        data.put("allowed", allowed);
        data.put("role", role);

        if (allowed) {
            return ResponseEntity.ok(ApiResponse.success("Switch to Employee Dashboard is allowed", data));
        }

        return ResponseEntity.ok(
                ApiResponse.success("Only Admin and Team Lead users can switch to Employee Dashboard.", data)
        );
    }

    private String extractBearerToken(String authorizationHeader) {
        if (authorizationHeader == null) {
            return "";
        }

        String value = authorizationHeader.trim();
        if (value.isEmpty()) {
            return "";
        }

        return value.startsWith("Bearer ") ? value.substring(7).trim() : value;
    }

    private String resolveRoleForSwitch(String email) {
        return userRepository.findByEmail(email)
                .map(user -> normalizeRole(user.getRole() == null ? "" : user.getRole().name()))
                .orElseGet(() -> employeeDetailsRepository.findByOfficialEmail(email)
                        .map(emp -> normalizeRole(emp.getRole()))
                        .orElse(""));
    }

    private boolean isAllowedSwitchRole(String role) {
        return "ADMIN".equals(role)
                || "TEAM_LEAD".equals(role)
                || "TEAM_LEADER".equals(role);
    }

    private String normalizeRole(String role) {
        if (role == null) {
            return "";
        }
        return role.trim().toUpperCase(Locale.ROOT).replace('-', '_').replace(' ', '_');
    }
}
