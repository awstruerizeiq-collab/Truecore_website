package com.hireconnect.dto.response;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private Long id;
    private String fullName;
    private String email;
    private String mobile;
    private String phone;
    private String position;
    private String department;
    private String role;
    private String status;
    private Integer onboardingStep;
    private String onboardingStatus;
    private Boolean approved;
    private Boolean isAdmin;
    private String adminRole;
    private LocalDateTime lastLoginAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Constructor from User entity
    public UserDTO(com.hireconnect.entity.User user) {
        this.id = user.getId();
        this.fullName = user.getFullName();
        this.email = user.getEmail();
        this.mobile = user.getMobile();
        this.phone = user.getPhone();
        this.position = user.getPosition();
        this.department = user.getDepartment();
        this.role = user.getRole() != null ? user.getRole().name() : null;
        this.status = user.getStatus() != null ? user.getStatus().name() : null;
        this.onboardingStep = user.getOnboardingStep();
        this.onboardingStatus = user.getOnboardingStatus() != null ? user.getOnboardingStatus().name() : null;
        this.approved = user.getApproved();
        this.isAdmin = user.getIsAdmin();
        this.adminRole = user.getAdminRole();
        this.lastLoginAt = user.getLastLoginAt();
        this.createdAt = user.getCreatedAt();
        this.updatedAt = user.getUpdatedAt();
    }
}