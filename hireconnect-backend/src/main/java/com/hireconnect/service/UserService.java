package com.hireconnect.service;

import java.io.IOException;
import java.net.URI;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.hireconnect.entity.User;
import com.hireconnect.repository.AccountDetailsRepository;
import com.hireconnect.repository.EmployeeDetailsRepository;
import com.hireconnect.repository.GrossSalaryDetailsRepository;
import com.hireconnect.repository.PerformanceRepository;
import com.hireconnect.repository.PersonalDetailsRepository;
import com.hireconnect.repository.UserRepository;
import com.hireconnect.util.FileStorageUtil;

@Service
public class UserService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmployeeDetailsRepository employeeDetailsRepository;

    @Autowired
    private PersonalDetailsRepository personalDetailsRepository;

    @Autowired
    private AccountDetailsRepository accountDetailsRepository;

    @Autowired
    private GrossSalaryDetailsRepository grossSalaryDetailsRepository;

    @Autowired
    private PerformanceRepository performanceRepository;
    
    @Value("${file.upload-dir:uploads/profile-photos}")
    private String uploadDir;
    
    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;
    
    // ========== TENANT-AWARE METHODS - NEW ==========
    
    /**
     * Get all users for a specific tenant (company)
     */
    public List<User> getAllUsersByTenant(String tenantCode) {
        if (tenantCode == null || tenantCode.trim().isEmpty()) {
            throw new RuntimeException("Tenant code is required");
        }
        return userRepository.findByTenantCodeAndDeletedAtIsNull(tenantCode);
    }
    
    /**
     * Get only employees for a specific tenant (excludes admins)
     */
    public List<User> getEmployeesByTenant(String tenantCode) {
        if (tenantCode == null || tenantCode.trim().isEmpty()) {
            throw new RuntimeException("Tenant code is required");
        }
        return userRepository.findEmployeesByTenantCode(tenantCode);
    }
    
    /**
     * Get employee count for a specific tenant
     */
    public long getEmployeeCountByTenant(String tenantCode) {
        if (tenantCode == null || tenantCode.trim().isEmpty()) {
            throw new RuntimeException("Tenant code is required");
        }
        return userRepository.countEmployeesByTenantCode(tenantCode);
    }
    
    /**
     * Search users within a specific tenant
     */
    public List<User> searchUsersByTenant(String tenantCode, String query) {
        if (tenantCode == null || tenantCode.trim().isEmpty()) {
            throw new RuntimeException("Tenant code is required");
        }
        return userRepository.searchUsersByTenantCode(tenantCode, query);
    }
    
    /**
     * Get users by department within a tenant
     */
    public List<User> getUsersByTenantAndDepartment(String tenantCode, String department) {
        if (tenantCode == null || tenantCode.trim().isEmpty()) {
            throw new RuntimeException("Tenant code is required");
        }
        return userRepository.findByTenantCodeAndDepartment(tenantCode, department);
    }
    
    /**
     * Get users by status within a tenant
     */
    public List<User> getUsersByTenantAndStatus(String tenantCode, String statusStr) {
        if (tenantCode == null || tenantCode.trim().isEmpty()) {
            throw new RuntimeException("Tenant code is required");
        }
        User.Status status = User.Status.valueOf(statusStr.toUpperCase());
        return userRepository.findByTenantCodeAndStatus(tenantCode, status);
    }
    
    /**
     * Get user by ID with tenant validation
     */
    public User getUserByIdWithTenantValidation(Long id, String tenantCode) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        
        // Validate user belongs to the correct tenant
        if (!user.getTenantCode().equals(tenantCode)) {
            throw new RuntimeException("Access denied: User does not belong to your company");
        }
        
        return user;
    }
    
    /**
     * Update user with tenant validation
     */
    @Transactional
    public User updateUserWithTenantValidation(Long id, User userDetails, String tenantCode) {
        User user = getUserByIdWithTenantValidation(id, tenantCode);
        
        if (userDetails.getFullName() != null) {
            user.setFullName(userDetails.getFullName());
        }
        if (userDetails.getOfficialEmail() != null && !userDetails.getOfficialEmail().isBlank()) {
            String normalizedOfficialEmail = userDetails.getOfficialEmail().trim().toLowerCase();
            // Keep login email and official email in sync for this flow.
            if (userRepository.existsByEmailAndTenantCode(normalizedOfficialEmail, tenantCode) &&
                !normalizedOfficialEmail.equalsIgnoreCase(user.getEmail())) {
                throw new RuntimeException("Email already exists for another employee in this company");
            }
            user.setOfficialEmail(normalizedOfficialEmail);
            user.setEmail(normalizedOfficialEmail);
        }
        if (userDetails.getEmail() != null) {
            // Check email uniqueness within tenant
            if (userRepository.existsByEmailAndTenantCode(userDetails.getEmail(), tenantCode) &&
                !user.getEmail().equals(userDetails.getEmail())) {
                throw new RuntimeException("Email already exists for another employee in this company");
            }
            user.setEmail(userDetails.getEmail());
        }
        if (userDetails.getMobile() != null) {
            user.setMobile(userDetails.getMobile());
        }
        if (userDetails.getPosition() != null) {
            user.setPosition(userDetails.getPosition());
        }
        if (userDetails.getDepartment() != null) {
            user.setDepartment(userDetails.getDepartment());
        }
        if (userDetails.getStatus() != null) {
            user.setStatus(userDetails.getStatus());
        }
        if (userDetails.getEmployeeId() != null) {
            // Check employee ID uniqueness within tenant
            if (userRepository.existsByEmployeeIdAndTenantCode(userDetails.getEmployeeId(), tenantCode) &&
                !user.getEmployeeId().equals(userDetails.getEmployeeId())) {
                throw new RuntimeException("Employee ID already exists for another employee in this company");
            }
            user.setEmployeeId(userDetails.getEmployeeId());
        }
        if (userDetails.getPassword() != null && !userDetails.getPassword().isBlank()) {
            if (userDetails.getPassword().length() < 6) {
                throw new RuntimeException("Password should be at least 6 characters");
            }
            user.setPassword(passwordEncoder.encode(userDetails.getPassword()));
            user.setPlainPassword(null);
            syncOfficialPasswordForUser(user.getId(), userDetails.getPassword());
        }
        
        user.setUpdatedAt(LocalDateTime.now());
        return userRepository.save(user);
    }

    @Transactional
    public void resetUserPasswordWithTenantValidation(Long id, String tenantCode, String newPassword) {
        if (tenantCode == null || tenantCode.trim().isEmpty()) {
            throw new RuntimeException("Tenant code is required");
        }
        if (newPassword == null || newPassword.isBlank()) {
            throw new RuntimeException("New password is required");
        }
        if (!newPassword.matches("^(?=.*[A-Z])(?=.*\\d).{8,}$")) {
            throw new RuntimeException(
                "Password must be at least 8 characters and include 1 uppercase letter and 1 number"
            );
        }

        User actor = getCurrentUser();
        boolean isAdmin = actor.getRole() == User.Role.ADMIN;
        boolean isGlobalAdmin = actor.getRole() == User.Role.GLOBAL_ADMIN;
        if (!isAdmin && !isGlobalAdmin) {
            throw new RuntimeException("Only ADMIN or SUPER_ADMIN can reset employee passwords");
        }
        if (isAdmin && !tenantCode.equals(actor.getTenantCode())) {
            throw new RuntimeException("Access denied for tenant");
        }

        User user = getUserByIdWithTenantValidation(id, tenantCode.trim());
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setPlainPassword(null);
        syncOfficialPasswordForUser(user.getId(), newPassword);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    @Transactional
    public void resetTeamLeaderPasswordWithTenantValidation(Long id, String tenantCode, String newPassword) {
        User target = getUserByIdWithTenantValidation(id, tenantCode);
        if (target.getRole() != User.Role.TEAM_LEAD) {
            throw new RuntimeException("Selected user is not a Team Leader");
        }
        resetUserPasswordWithTenantValidation(id, tenantCode, newPassword);
    }
    
    /**
     * Delete user with tenant validation
     */
    @Transactional
    public void deleteUserWithTenantValidation(Long id, String tenantCode) {
        User user = getUserByIdWithTenantValidation(id, tenantCode);
        hardDeleteEmployee(user.getId());
    }
    
    // ========== EXISTING METHODS (KEPT FOR COMPATIBILITY) ==========
    
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
    
    public User getUserById(Long id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
    }
    
    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated() || 
            authentication.getPrincipal().equals("anonymousUser")) {
            throw new RuntimeException("User is not authenticated");
        }

        String email = authentication.getName();
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Transactional
    public User updateUser(Long id, User userDetails) {
        User user = getUserById(id);
        
        if (userDetails.getFullName() != null) {
            user.setFullName(userDetails.getFullName());
        }
        if (userDetails.getEmail() != null) {
            user.setEmail(userDetails.getEmail());
        }
        if (userDetails.getMobile() != null) {
            user.setMobile(userDetails.getMobile());
        }
        if (userDetails.getPosition() != null) {
            user.setPosition(userDetails.getPosition());
        }
        if (userDetails.getDepartment() != null) {
            user.setDepartment(userDetails.getDepartment());
        }
        if (userDetails.getStatus() != null) {
            user.setStatus(userDetails.getStatus());
        }
        if (userDetails.getEmployeeId() != null) {
            user.setEmployeeId(userDetails.getEmployeeId());
        }
        
        user.setUpdatedAt(LocalDateTime.now());
        return userRepository.save(user);
    }
    
    @Transactional
    public User updateCurrentUser(User userDetails) {
        User currentUser = getCurrentUser();
        return updateUser(currentUser.getId(), userDetails);
    }
    
    @Transactional
    public void changePassword(String oldPassword, String newPassword) {
        User currentUser = getCurrentUser();
        
        if (!passwordEncoder.matches(oldPassword, currentUser.getPassword())) {
            throw new RuntimeException("Old password is incorrect");
        }
        
        currentUser.setPassword(passwordEncoder.encode(newPassword));
        currentUser.setPlainPassword(null);
        syncOfficialPasswordForUser(currentUser.getId(), newPassword);
        currentUser.setUpdatedAt(LocalDateTime.now());
        
        userRepository.save(currentUser);
    }
    
    @Transactional
    public void deleteUser(Long id) {
        hardDeleteEmployee(id);
    }

    @Transactional
    public void hardDeleteEmployee(Long userId) {
        getUserById(userId);

        performanceRepository.deleteByUserId(userId);
        grossSalaryDetailsRepository.deleteByUserId(userId);
        accountDetailsRepository.deleteByUserId(userId);
        personalDetailsRepository.deleteByUserId(userId);
        employeeDetailsRepository.deleteByUserId(userId);

        userRepository.deleteById(userId);
    }

    @Transactional
    public int hardDeleteUsersByTenantCode(String tenantCode) {
        if (tenantCode == null || tenantCode.trim().isEmpty()) {
            throw new RuntimeException("Tenant code is required");
        }

        List<User> users = userRepository.findByTenantCodeAndDeletedAtIsNull(tenantCode.trim());
        int deletedCount = 0;

        for (User user : users) {
            if (user.getRole() == User.Role.GLOBAL_ADMIN) {
                continue;
            }
            hardDeleteEmployee(user.getId());
            deletedCount++;
        }

        return deletedCount;
    }

    private void syncOfficialPasswordForUser(Long userId, String rawPassword) {
        if (userId == null || rawPassword == null) {
            return;
        }
        employeeDetailsRepository.findByUserId(userId).ifPresent(employeeDetails -> {
            employeeDetails.setOfficialPassword(rawPassword);
            employeeDetailsRepository.save(employeeDetails);
        });
    }
    
    public List<User> getUsersByRole(String roleStr) {
        User.Role role = User.Role.valueOf(roleStr.toUpperCase());
        return userRepository.findByRole(role);
    }
    
    public List<User> getUsersByStatus(String statusStr) {
        User.Status status = User.Status.valueOf(statusStr.toUpperCase());
        return userRepository.findByStatus(status);
    }
    
    public List<User> searchUsers(String query) {
        return userRepository.searchUsers(query);
    }
    
    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
    }
    
    // ========== IMAGE UPLOAD METHODS ==========
    
    /**
     * Upload profile photo for any user
     */
    @Transactional
    public String uploadUserPhotoSimple(Long userId, MultipartFile file) {
        validateImageFile(file);

        User user = getUserById(userId);

        String normalizedBaseUrl = baseUrl == null ? "http://localhost:8080" : baseUrl.replaceAll("/+$", "");
        String photoUrl = normalizedBaseUrl + "/api/users/" + userId + "/photo/content";

        try {
            user.setProfilePhotoData(file.getBytes());
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file: " + e.getMessage(), e);
        }
        user.setProfilePhotoContentType(file.getContentType());
        user.setProfilePhotoUrl(photoUrl);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        return photoUrl;
    }
    
    /**
     * Get user's profile photo URL
     */
    public String getUserPhotoUrl(Long userId) {
        User user = getUserById(userId);
        return user.getProfilePhotoUrl();
    }
    
    /**
     * Delete user's profile photo
     */
    @Transactional
    public void deleteUserPhotoSimple(Long userId) {
        User user = getUserById(userId);
        if (user.getProfilePhotoUrl() != null || user.getProfilePhotoData() != null) {
            user.setProfilePhotoUrl(null);
            user.setProfilePhotoContentType(null);
            user.setProfilePhotoData(null);
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);
        }
    }

    public ResponseEntity<Resource> getUserPhotoContent(Long userId) {
        User user = getUserById(userId);
        return FileStorageUtil.buildResponse(
                user.getProfilePhotoData(),
                buildLegacyPhotoPath(user.getProfilePhotoUrl()),
                user.getProfilePhotoContentType(),
                "profile-photo",
                false
        );
    }
    
    // ========== HELPER METHODS ==========
    
    /**
     * Validate uploaded image file
     */
    private void validateImageFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("Please select a file to upload");
        }
        
        // Check file size (max 5MB)
        long maxSize = 5 * 1024 * 1024; // 5MB
        if (file.getSize() > maxSize) {
            throw new RuntimeException("File size must be less than 5MB");
        }
        
        // Check file type
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new RuntimeException("Only image files are allowed");
        }
        
        // Validate specific image types
        String[] allowedTypes = {"image/jpeg", "image/jpg", "image/png", "image/gif"};
        boolean isValidType = false;
        for (String type : allowedTypes) {
            if (type.equals(contentType)) {
                isValidType = true;
                break;
            }
        }
        
        if (!isValidType) {
            throw new RuntimeException("Only JPEG, PNG, and GIF images are allowed");
        }
    }
    
    private String buildLegacyPhotoPath(String photoUrl) {
        if (photoUrl == null || photoUrl.isBlank()) {
            return null;
        }
        try {
            if (photoUrl.startsWith("http://") || photoUrl.startsWith("https://")) {
                String path = URI.create(photoUrl).getPath();
                return path.startsWith("/api/") ? null : path;
            }
        } catch (Exception ignored) {
        }
        if (photoUrl.startsWith("/api/")) {
            return null;
        }
        if (photoUrl.startsWith("/uploads/")) {
            return photoUrl;
        }
        String filename = photoUrl.substring(photoUrl.lastIndexOf('/') + 1);
        return uploadDir + "/" + filename;
    }
    
    public List<User> getAdminsByTenantCompany(String tenantCode, Long companyId) {
        if (tenantCode == null || tenantCode.trim().isEmpty()) {
            throw new RuntimeException("Tenant code is required");
        }
        if (companyId == null) {
            throw new RuntimeException("Company ID is required");
        }
        return userRepository.findAdminsByTenantCompany(tenantCode.trim(), companyId);
    }

    public List<User> getTeamLeadsByTenantCompany(String tenantCode, Long companyId) {
        if (tenantCode == null || tenantCode.trim().isEmpty()) {
            throw new RuntimeException("Tenant code is required");
        }
        if (companyId == null) {
            throw new RuntimeException("Company ID is required");
        }
        return userRepository.findTeamLeadsByTenantCompany(tenantCode.trim(), companyId);
    }

    @Transactional
    public User createAdminForTenantCompany(String tenantCode, Long companyId, Map<String, String> payload) {
        if (tenantCode == null || tenantCode.trim().isEmpty()) throw new RuntimeException("Tenant code is required");
        if (companyId == null) throw new RuntimeException("Company ID is required");

        String name = payload.getOrDefault("name", "").trim();
        String email = payload.getOrDefault("email", "").trim();
        String password = payload.getOrDefault("password", "").trim();
        String adminRole = payload.getOrDefault("role", "").trim(); // SUPER_ADMIN / ADMIN / MANAGER

        if (name.isEmpty()) throw new RuntimeException("Name is required");
        if (email.isEmpty()) throw new RuntimeException("Email is required");
        if (password.isEmpty()) throw new RuntimeException("Password is required");
        if (adminRole.isEmpty()) throw new RuntimeException("Role is required");

        // ✅ prevent duplicate admin inside same company
        if (userRepository.findAdminByTenantCompanyAndEmail(tenantCode.trim(), companyId, email).isPresent()) {
            throw new RuntimeException("Admin already exists for this company");
        }

        User u = new User();
        u.setFullName(name);
        u.setEmail(email);
        u.setPassword(passwordEncoder.encode(password));
        u.setPlainPassword(password);

        u.setTenantCode(tenantCode.trim());
        u.setCompanyId(companyId);

        u.setRole(User.Role.ADMIN);
        u.setIsAdmin(true);
        u.setAdminRole(adminRole);

        u.setApproved(true);
        u.setStatus(User.Status.ACTIVE);
        u.setIsActive(true);

        u.setUpdatedAt(LocalDateTime.now());
        return userRepository.save(u);
    }

    @Transactional
    public User createTeamLeadForTenantCompany(String tenantCode, Long companyId, Map<String, String> payload) {
        if (tenantCode == null || tenantCode.trim().isEmpty()) throw new RuntimeException("Tenant code is required");
        if (companyId == null) throw new RuntimeException("Company ID is required");

        String name = payload.getOrDefault("name", "").trim();
        String email = payload.getOrDefault("email", "").trim();
        String password = payload.getOrDefault("password", "").trim();

        if (name.isEmpty()) throw new RuntimeException("Name is required");
        if (email.isEmpty()) throw new RuntimeException("Email is required");
        if (password.isEmpty()) throw new RuntimeException("Password is required");

        if (userRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("Email already exists");
        }

        if (userRepository.findTeamLeadByTenantCompanyAndEmail(tenantCode.trim(), companyId, email).isPresent()) {
            throw new RuntimeException("Team leader already exists for this company");
        }

        User u = new User();
        u.setFullName(name);
        u.setEmail(email);
        u.setPassword(passwordEncoder.encode(password));
        u.setPlainPassword(password);

        u.setTenantCode(tenantCode.trim());
        u.setCompanyId(companyId);

        u.setRole(User.Role.TEAM_LEAD);
        u.setIsAdmin(false);
        u.setAdminRole("TEAM_LEADER");

        u.setApproved(true);
        u.setStatus(User.Status.ACTIVE);
        u.setIsActive(true);

        u.setUpdatedAt(LocalDateTime.now());
        return userRepository.save(u);
    }

}
