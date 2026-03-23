package com.hireconnect.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "full_name")
    private String fullName;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(name = "official_email", nullable = false)
    private String officialEmail;

    @Column(nullable = false)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;
    
    @Column
    private String employeeId;

    @Column(name = "plain_password")
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String plainPassword;

    private String mobile;
    
    private String phone;
    
    private String position;
    
    private String dob;
    
    private String joiningDate;
    
    private String department;

    // ========== NEW FIELD FOR TENANT MAPPING ==========
    @Column(name = "tenant_code", nullable = false)
    private String tenantCode;  // Links employee to their company

    @Column(name = "company_id")
    private Long companyId;  // Optional: Direct FK to company table
    
    @Column(name = "company_name")
    private String companyName;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.ACTIVE;

    @Column(name = "onboarding_step")
    private Integer onboardingStep = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "onboarding_status")
    private OnboardingStatus onboardingStatus = OnboardingStatus.NOT_STARTED;

    @Column(nullable = false)
    private Boolean approved = false;

    @Column(name = "is_admin")
    private Boolean isAdmin = false;
    
    @Column(name = "is_active")
    private Boolean isActive = false;
    
    @Column(name = "profile_photo_url", length = 500)
    private String profilePhotoUrl;

    @Column(name = "profile_photo_content_type", length = 255)
    private String profilePhotoContentType;

    @JsonIgnore
    @Lob
    @Column(name = "profile_photo_data", columnDefinition = "LONGBLOB")
    private byte[] profilePhotoData;

    @Column(name = "admin_role")
    private String adminRole;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;
    
    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "deleted_by")
    private Long deletedBy;

    @Column(columnDefinition = "TEXT")
    private String profile;

    @Column(name = "offer_letter_url")
    private String offerLetterUrl;

    @Column(name = "offer_letter_uploaded")
    private Boolean offerLetterUploaded = false;

    @Column(name = "id_card_generated")
    private Boolean idCardGenerated = false;
    
    @Column(name = "terms_agreed")
    private Boolean termsAgreed = false;
    
    @Column(name = "is_verified")
    private Boolean isVerified = false;
    
    @Column(name = "verification_token")
    private String verificationToken;
    
    @Column(name = "reset_password_token")
    private String resetPasswordToken;
    
    @Column(name = "reset_password_expire")
    private LocalDateTime resetPasswordExpire;
    
    @Column(name = "last_step_completed_at")
    private LocalDateTime lastStepCompletedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    
    public enum Role {
        ADMIN, EMPLOYEE ,GLOBAL_ADMIN,TEAM_LEAD// Added COMPANY_ADMIN role
    }

    public enum Status {
        ACTIVE, INACTIVE, PENDING
    }

    public enum OnboardingStatus {
        NOT_STARTED, IN_PROGRESS, COMPLETE
    }
    
    
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
        if (approved == null) {
            approved = false;
        }
        if (isAdmin == null) {
            isAdmin = false;
        }
        if (termsAgreed == null) {
            termsAgreed = false;
        }
        if (isVerified == null) {
            isVerified = false;
        }
        if (offerLetterUploaded == null) {
            offerLetterUploaded = false;
        }
        if (idCardGenerated == null) {
            idCardGenerated = false;
        }
        if (officialEmail == null || officialEmail.isBlank()) {
            officialEmail = email;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // ========== GETTERS AND SETTERS ==========
    
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email == null ? null : email.trim().toLowerCase();
    }

    public String getOfficialEmail() {
        return officialEmail;
    }

    public void setOfficialEmail(String officialEmail) {
        this.officialEmail = officialEmail == null ? null : officialEmail.trim().toLowerCase();
    }

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(String employeeId) {
        this.employeeId = employeeId;
    }

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    public String getPlainPassword() {
        return plainPassword;
    }

    public void setPlainPassword(String plainPassword) {
        this.plainPassword = plainPassword;
    }

    public String getMobile() {
        return mobile;
    }

    public void setMobile(String mobile) {
        this.mobile = mobile;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getPosition() {
        return position;
    }

    public void setPosition(String position) {
        this.position = position;
    }

    public String getDob() {
        return dob;
    }

    public void setDob(String dob) {
        this.dob = dob;
    }

    public String getJoiningDate() {
        return joiningDate;
    }

    public void setJoiningDate(String joiningDate) {
        this.joiningDate = joiningDate;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    // NEW GETTERS/SETTERS FOR TENANT MAPPING
    public String getTenantCode() {
        return tenantCode;
    }

    public void setTenantCode(String tenantCode) {
        this.tenantCode = tenantCode;
    }

    public Long getCompanyId() {
        return companyId;
    }

    public void setCompanyId(Long companyId) {
        this.companyId = companyId;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public Integer getOnboardingStep() {
        return onboardingStep;
    }

    public void setOnboardingStep(Integer onboardingStep) {
        this.onboardingStep = onboardingStep;
    }

    public OnboardingStatus getOnboardingStatus() {
        return onboardingStatus;
    }

    public void setOnboardingStatus(OnboardingStatus onboardingStatus) {
        this.onboardingStatus = onboardingStatus;
    }

    public Boolean getApproved() {
        return approved;
    }

    public void setApproved(Boolean approved) {
        this.approved = approved;
    }

    public Boolean getIsAdmin() {
        return isAdmin;
    }

    public void setIsAdmin(Boolean isAdmin) {
        this.isAdmin = isAdmin;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public String getProfilePhotoUrl() {
        return profilePhotoUrl;
    }

    public void setProfilePhotoUrl(String profilePhotoUrl) {
        this.profilePhotoUrl = profilePhotoUrl;
    }

    public String getProfilePhotoContentType() {
        return profilePhotoContentType;
    }

    public void setProfilePhotoContentType(String profilePhotoContentType) {
        this.profilePhotoContentType = profilePhotoContentType;
    }

    public byte[] getProfilePhotoData() {
        return profilePhotoData;
    }

    public void setProfilePhotoData(byte[] profilePhotoData) {
        this.profilePhotoData = profilePhotoData;
    }

    public String getAdminRole() {
        return adminRole;
    }

    public void setAdminRole(String adminRole) {
        this.adminRole = adminRole;
    }

    public LocalDateTime getLastLoginAt() {
        return lastLoginAt;
    }

    public void setLastLoginAt(LocalDateTime lastLoginAt) {
        this.lastLoginAt = lastLoginAt;
    }

    public LocalDateTime getLastLogin() {
        return lastLogin;
    }

    public void setLastLogin(LocalDateTime lastLogin) {
        this.lastLogin = lastLogin;
    }

    public LocalDateTime getDeletedAt() {
        return deletedAt;
    }

    public void setDeletedAt(LocalDateTime deletedAt) {
        this.deletedAt = deletedAt;
    }

    public Long getDeletedBy() {
        return deletedBy;
    }

    public void setDeletedBy(Long deletedBy) {
        this.deletedBy = deletedBy;
    }

    public String getProfile() {
        return profile;
    }

    public void setProfile(String profile) {
        this.profile = profile;
    }

    public String getOfferLetterUrl() {
        return offerLetterUrl;
    }

    public void setOfferLetterUrl(String offerLetterUrl) {
        this.offerLetterUrl = offerLetterUrl;
    }

    public Boolean getOfferLetterUploaded() {
        return offerLetterUploaded;
    }

    public void setOfferLetterUploaded(Boolean offerLetterUploaded) {
        this.offerLetterUploaded = offerLetterUploaded;
    }

    public Boolean getIdCardGenerated() {
        return idCardGenerated;
    }

    public void setIdCardGenerated(Boolean idCardGenerated) {
        this.idCardGenerated = idCardGenerated;
    }

    public Boolean getTermsAgreed() {
        return termsAgreed;
    }

    public void setTermsAgreed(Boolean termsAgreed) {
        this.termsAgreed = termsAgreed;
    }

    public Boolean getIsVerified() {
        return isVerified;
    }

    public void setIsVerified(Boolean isVerified) {
        this.isVerified = isVerified;
    }

    public String getVerificationToken() {
        return verificationToken;
    }

    public void setVerificationToken(String verificationToken) {
        this.verificationToken = verificationToken;
    }

    public String getResetPasswordToken() {
        return resetPasswordToken;
    }

    public void setResetPasswordToken(String resetPasswordToken) {
        this.resetPasswordToken = resetPasswordToken;
    }

    public LocalDateTime getResetPasswordExpire() {
        return resetPasswordExpire;
    }

    public void setResetPasswordExpire(LocalDateTime resetPasswordExpire) {
        this.resetPasswordExpire = resetPasswordExpire;
    }

    public LocalDateTime getLastStepCompletedAt() {
        return lastStepCompletedAt;
    }

    public void setLastStepCompletedAt(LocalDateTime lastStepCompletedAt) {
        this.lastStepCompletedAt = lastStepCompletedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
