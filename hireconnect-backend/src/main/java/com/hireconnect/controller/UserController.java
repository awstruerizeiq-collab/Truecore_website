package com.hireconnect.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.hireconnect.dto.response.ApiResponse;
import com.hireconnect.entity.User;
import com.hireconnect.service.UserService;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {
    
    @Autowired
    private UserService userService;
    
    // ========== TENANT-AWARE ENDPOINTS - NEW ==========
    
    /**
     * Get all employees for a specific tenant (company)
     * Requires tenantCode in header
     */
    @GetMapping("/tenant")
    public ResponseEntity<ApiResponse<List<User>>> getUsersByTenant(
            @RequestHeader("X-Tenant-Code") String tenantCode) {
        try {
            List<User> users = userService.getAllUsersByTenant(tenantCode);
            return ResponseEntity.ok(ApiResponse.success("Users fetched for tenant", users));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * Get only employees (no admins) for a specific tenant
     */
    @GetMapping("/tenant/employees")
    public ResponseEntity<ApiResponse<List<User>>> getEmployeesByTenant(
            @RequestHeader("X-Tenant-Code") String tenantCode) {
        try {
            List<User> users = userService.getEmployeesByTenant(tenantCode);
            return ResponseEntity.ok(ApiResponse.success("Employees fetched for tenant", users));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * Get employee count for a specific tenant
     */
    @GetMapping("/tenant/count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getEmployeeCountByTenant(
            @RequestHeader("X-Tenant-Code") String tenantCode) {
        try {
            long count = userService.getEmployeeCountByTenant(tenantCode);
            return ResponseEntity.ok(ApiResponse.success("Employee count fetched", 
                Map.of("employeeCount", count)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * Search users within a specific tenant
     */
    @GetMapping("/tenant/search")
    public ResponseEntity<ApiResponse<List<User>>> searchUsersByTenant(
            @RequestHeader("X-Tenant-Code") String tenantCode,
            @RequestParam String query) {
        try {
            List<User> users = userService.searchUsersByTenant(tenantCode, query);
            return ResponseEntity.ok(ApiResponse.success("Search results for tenant", users));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * Get users by department within a tenant
     */
    @GetMapping("/tenant/department/{department}")
    public ResponseEntity<ApiResponse<List<User>>> getUsersByTenantAndDepartment(
            @RequestHeader("X-Tenant-Code") String tenantCode,
            @PathVariable String department) {
        try {
            List<User> users = userService.getUsersByTenantAndDepartment(tenantCode, department);
            return ResponseEntity.ok(ApiResponse.success("Users fetched by department", users));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * Get users by status within a tenant
     */
    @GetMapping("/tenant/status/{status}")
    public ResponseEntity<ApiResponse<List<User>>> getUsersByTenantAndStatus(
            @RequestHeader("X-Tenant-Code") String tenantCode,
            @PathVariable String status) {
        try {
            List<User> users = userService.getUsersByTenantAndStatus(tenantCode, status);
            return ResponseEntity.ok(ApiResponse.success("Users fetched by status", users));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * Get user by ID with tenant validation
     */
    @GetMapping("/tenant/{id}")
    public ResponseEntity<ApiResponse<User>> getUserByIdWithTenantValidation(
            @RequestHeader("X-Tenant-Code") String tenantCode,
            @PathVariable Long id) {
        try {
            User user = userService.getUserByIdWithTenantValidation(id, tenantCode);
            return ResponseEntity.ok(ApiResponse.success("User fetched", user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * Update user with tenant validation
     */
    @PutMapping("/tenant/{id}")
    public ResponseEntity<ApiResponse<User>> updateUserWithTenantValidation(
            @RequestHeader("X-Tenant-Code") String tenantCode,
            @PathVariable Long id,
            @RequestBody User user) {
        try {
            User updated = userService.updateUserWithTenantValidation(id, user, tenantCode);
            return ResponseEntity.ok(ApiResponse.success("User updated", updated));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PatchMapping("/tenant/{id}/reset-password")
    public ResponseEntity<ApiResponse<String>> resetUserPasswordWithTenantValidation(
            @RequestHeader("X-Tenant-Code") String tenantCode,
            @PathVariable Long id,
            @RequestBody Map<String, String> payload) {
        try {
            userService.resetUserPasswordWithTenantValidation(id, tenantCode, payload.get("newPassword"));
            return ResponseEntity.ok(ApiResponse.success("Password reset successful", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PatchMapping("/tenant/team-leaders/{id}/reset-password")
    public ResponseEntity<ApiResponse<String>> resetTeamLeaderPasswordWithTenantValidation(
            @RequestHeader("X-Tenant-Code") String tenantCode,
            @PathVariable Long id,
            @RequestBody Map<String, String> payload) {
        try {
            userService.resetTeamLeaderPasswordWithTenantValidation(id, tenantCode, payload.get("newPassword"));
            return ResponseEntity.ok(ApiResponse.success("Team leader password reset successful", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * Delete user with tenant validation
     */
    @DeleteMapping("/tenant/{id}")
    public ResponseEntity<ApiResponse<String>> deleteUserWithTenantValidation(
            @RequestHeader("X-Tenant-Code") String tenantCode,
            @PathVariable Long id) {
        try {
            userService.deleteUserWithTenantValidation(id, tenantCode);
            return ResponseEntity.ok(ApiResponse.success("User deleted", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    // ========== EXISTING ENDPOINTS (KEPT FOR COMPATIBILITY) ==========
    
    @GetMapping
    public ResponseEntity<ApiResponse<List<User>>> getAllUsers() {
        try {
            List<User> users = userService.getAllUsers();
            return ResponseEntity.ok(ApiResponse.success("Users fetched", users));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<User>> getUserById(@PathVariable Long id) {
        try {
            User user = userService.getUserById(id);
            return ResponseEntity.ok(ApiResponse.success("User fetched", user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<User>> getCurrentUser() {
        try {
            User user = userService.getCurrentUser();
            return ResponseEntity.ok(ApiResponse.success("Current user fetched", user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<User>> updateUser(
            @PathVariable Long id,
            @RequestBody User user) {
        try {
            User updated = userService.updateUser(id, user);
            return ResponseEntity.ok(ApiResponse.success("User updated", updated));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PutMapping("/me")
    public ResponseEntity<ApiResponse<User>> updateCurrentUser(@RequestBody User user) {
        try {
            User updated = userService.updateCurrentUser(user);
            return ResponseEntity.ok(ApiResponse.success("Profile updated", updated));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    // ========== IMAGE UPLOAD ENDPOINTS ==========
    
    @PostMapping("/{userId}/upload-photo")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadUserPhotoSimple(
            @PathVariable Long userId,
            @RequestParam("photo") MultipartFile file) {
        try {
            String photoUrl = userService.uploadUserPhotoSimple(userId, file);
            Map<String, String> response = Map.of(
                "photoUrl", photoUrl,
                "message", "Profile photo uploaded successfully"
            );
            return ResponseEntity.ok(ApiResponse.success("Photo uploaded", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PostMapping("/me/upload-photo")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadPhotoWithUserId(
            @RequestParam("photo") MultipartFile file,
            @RequestParam(value = "userId", required = false) Long userId) {
        try {
            if (userId == null) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("userId is required"));
            }
            String photoUrl = userService.uploadUserPhotoSimple(userId, file);
            Map<String, String> response = Map.of(
                "photoUrl", photoUrl,
                "message", "Profile photo uploaded successfully"
            );
            return ResponseEntity.ok(ApiResponse.success("Photo uploaded", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/{userId}/photo")
    public ResponseEntity<ApiResponse<Map<String, String>>> getUserPhoto(@PathVariable Long userId) {
        try {
            String photoUrl = userService.getUserPhotoUrl(userId);
            Map<String, String> response = Map.of("photoUrl", photoUrl != null ? photoUrl : "");
            return ResponseEntity.ok(ApiResponse.success("Photo URL fetched", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/{userId}/photo/content")
    public ResponseEntity<Resource> getUserPhotoContent(@PathVariable Long userId) {
        try {
            return userService.getUserPhotoContent(userId);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @DeleteMapping("/{userId}/photo")
    public ResponseEntity<ApiResponse<String>> deleteUserPhotoSimple(@PathVariable Long userId) {
        try {
            userService.deleteUserPhotoSimple(userId);
            return ResponseEntity.ok(ApiResponse.success("Profile photo deleted", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    // ========== OTHER ENDPOINTS ==========
    
    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<String>> changePassword(@RequestBody Map<String, String> request) {
        try {
            String oldPassword = request.get("oldPassword");
            String newPassword = request.get("newPassword");
            userService.changePassword(oldPassword, newPassword);
            return ResponseEntity.ok(ApiResponse.success("Password changed successfully", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> deleteUser(@PathVariable Long id) {
        try {
            userService.deleteUser(id);
            return ResponseEntity.ok(ApiResponse.success("User deleted", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/role/{role}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<User>>> getUsersByRole(@PathVariable String role) {
        try {
            List<User> users = userService.getUsersByRole(role);
            return ResponseEntity.ok(ApiResponse.success("Users fetched", users));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/status/{status}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<User>>> getUsersByStatus(@PathVariable String status) {
        try {
            List<User> users = userService.getUsersByStatus(status);
            return ResponseEntity.ok(ApiResponse.success("Users fetched", users));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/search")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<User>>> searchUsers(@RequestParam String query) {
        try {
            List<User> users = userService.searchUsers(query);
            return ResponseEntity.ok(ApiResponse.success("Search results", users));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/tenant/admins")
    public ResponseEntity<ApiResponse<List<User>>> getAdminsByTenantCompany(
            @RequestHeader("X-Tenant-Code") String tenantCode,
            @RequestHeader("X-Company-Id") Long companyId
    ) {
        try {
            List<User> admins = userService.getAdminsByTenantCompany(tenantCode, companyId);
            return ResponseEntity.ok(ApiResponse.success("Admins fetched", admins));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/tenant/team-leaders")
    public ResponseEntity<ApiResponse<List<User>>> getTeamLeadsByTenantCompany(
            @RequestHeader("X-Tenant-Code") String tenantCode,
            @RequestHeader("X-Company-Id") String companyIdHeader
    ) {
        try {
            Long companyId = Long.parseLong(companyIdHeader.trim());
            List<User> teamLeads = userService.getTeamLeadsByTenantCompany(tenantCode, companyId);
            return ResponseEntity.ok(ApiResponse.success("Team leaders fetched", teamLeads));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/tenant/admins")
    public ResponseEntity<ApiResponse<User>> createAdminByTenantCompany(
            @RequestHeader("X-Tenant-Code") String tenantCode,
            @RequestHeader("X-Company-Id") Long companyId,
            @RequestBody Map<String, String> payload
    ) {
        try {
            User created = userService.createAdminForTenantCompany(tenantCode, companyId, payload);
            return ResponseEntity.ok(ApiResponse.success("Admin created", created));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/tenant/team-leaders")
    public ResponseEntity<ApiResponse<User>> createTeamLeadByTenantCompany(
            @RequestHeader("X-Tenant-Code") String tenantCode,
            @RequestHeader("X-Company-Id") String companyIdHeader,
            @RequestBody Map<String, String> payload
    ) {
        try {
            Long companyId = Long.parseLong(companyIdHeader.trim());
            User created = userService.createTeamLeadForTenantCompany(tenantCode, companyId, payload);
            return ResponseEntity.ok(ApiResponse.success("Team leader created", created));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }


}
