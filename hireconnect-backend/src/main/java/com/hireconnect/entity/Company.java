package com.hireconnect.entity;

import java.time.LocalDate;
import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

@Entity
@Table(
    name = "companies",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_companies_tenant_code", columnNames = {"tenant_code"}),
        @UniqueConstraint(name = "uk_companies_tenant_official_email", columnNames = {"tenant_code", "company_official_email"})
    },
    indexes = {
        @Index(name = "idx_companies_tenant_email", columnList = "tenant_code,company_official_email")
    }
)
public class Company {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /* BASIC INFO */
    @Column(name = "legal_name", nullable = false, length = 255)
    private String legalName;

    @Column(name = "display_name", nullable = false, unique = true, length = 255)
    private String displayName;

    @Column(name = "tenant_code", nullable = false, unique = true, length = 100)
    private String tenantCode;

    @Column(name = "organization_type", length = 100)
    private String organizationType;

    @Column(name = "industry", length = 100)
    private String industry;

    @Column(name = "gst_no", length = 50)
    private String gstNo;

    /* ADMIN */
    @Column(name = "admin", nullable = false, length = 255)
    private String admin;

    @Column(name = "admin_email", nullable = false, unique = true, length = 255)
    private String adminEmail;

    @Column(name = "mobile_number", length = 20)
    private String mobileNumber;

    @Column(name = "role", length = 50)
    private String role = "COMPANY_ADMIN";

    /* CONTACT */
    @Column(name = "address", length = 500)
    private String address;

    @Column(name = "city", length = 100)
    private String city;

    @Column(name = "state", length = 100)
    private String state;

    @Column(name = "country", length = 100)
    private String country;

    @Column(name = "pincode", length = 20)
    private String pincode;

    @Column(name = "official_email", length = 255)
    private String officialEmail;

    @Column(name = "company_official_email", length = 255)
    private String companyOfficialEmail;

    @JsonIgnore
    @Column(name = "company_official_password_hash", length = 255)
    private String companyOfficialPasswordHash;

    @Transient
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String companyOfficialPassword;

    @Column(name = "phone_number", length = 20)
    private String phoneNumber;

    @Column(name = "website", length = 255)
    private String website;

    @Column(name = "logo_path", length = 1024)
    private String logoPath;

    @Column(name = "logo_content_type", length = 255)
    private String logoContentType;

    @JsonIgnore
    @Lob
    @Column(name = "logo_data", columnDefinition = "LONGBLOB")
    private byte[] logoData;

    @Transient
    private String logoUrl;

    /* SUBSCRIPTION */
    @Column(name = "plan", nullable = false, length = 50)
    private String plan = "Basic";

    @Column(name = "employee_limit", nullable = false)
    private Integer employeeLimit = 50;

    @Column(name = "storage_limit", nullable = false, length = 50)
    private String storageLimit = "10 GB";

    @Column(name = "billing_cycle", length = 50)
    private String billingCycle = "monthly";

    @Column(name = "start_date")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate startDate;

    /* SYSTEM */
    @Column(name = "employees", nullable = false)
    private Integer employees = 0;

    @Column(name = "storage", length = 50)
    private String storage = "0 GB";

    @Column(name = "status", nullable = false, length = 20)
    private String status = "active";

    @Column(name = "created_date")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate createdDate;

    @Column(name = "updated_date")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate updatedDate;

    // Constructors
    public Company() {
        this.employees = 0;
        this.storage = "0 GB";
        this.status = "active";
        this.role = "COMPANY_ADMIN";
        this.plan = "Basic";
        this.employeeLimit = 50;
        this.storageLimit = "10 GB";
        this.billingCycle = "monthly";
    }

    // Lifecycle callbacks
    @PrePersist
    protected void onCreate() {
        this.createdDate = LocalDate.now();
        this.updatedDate = LocalDate.now();
        if (this.employees == null) this.employees = 0;
        if (this.storage == null) this.storage = "0 GB";
        if (this.status == null) this.status = "active";
        if (this.role == null) this.role = "COMPANY_ADMIN";
        if ((this.companyOfficialEmail == null || this.companyOfficialEmail.isBlank()) && this.officialEmail != null) {
            this.companyOfficialEmail = this.officialEmail.trim().toLowerCase();
        }
        if ((this.officialEmail == null || this.officialEmail.isBlank()) && this.companyOfficialEmail != null) {
            this.officialEmail = this.companyOfficialEmail.trim().toLowerCase();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedDate = LocalDate.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getLegalName() {
        return legalName;
    }

    public void setLegalName(String legalName) {
        this.legalName = legalName;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getTenantCode() {
        return tenantCode;
    }

    public void setTenantCode(String tenantCode) {
        this.tenantCode = tenantCode;
    }

    public String getOrganizationType() {
        return organizationType;
    }

    public void setOrganizationType(String organizationType) {
        this.organizationType = organizationType;
    }

    public String getIndustry() {
        return industry;
    }

    public void setIndustry(String industry) {
        this.industry = industry;
    }

    public String getGstNo() {
        return gstNo;
    }

    public void setGstNo(String gstNo) {
        this.gstNo = gstNo;
    }

    public String getAdmin() {
        return admin;
    }

    public void setAdmin(String admin) {
        this.admin = admin;
    }

    public String getAdminEmail() {
        return adminEmail;
    }

    public void setAdminEmail(String adminEmail) {
        this.adminEmail = adminEmail;
    }

    public String getMobileNumber() {
        return mobileNumber;
    }

    public void setMobileNumber(String mobileNumber) {
        this.mobileNumber = mobileNumber;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public String getPincode() {
        return pincode;
    }

    public void setPincode(String pincode) {
        this.pincode = pincode;
    }

    public String getOfficialEmail() {
        if (companyOfficialEmail != null && !companyOfficialEmail.isBlank()) {
            return companyOfficialEmail;
        }
        return officialEmail;
    }

    public void setOfficialEmail(String officialEmail) {
        String normalized = officialEmail == null ? null : officialEmail.trim().toLowerCase();
        this.officialEmail = normalized;
        this.companyOfficialEmail = normalized;
    }

    public String getCompanyOfficialEmail() {
        if (companyOfficialEmail != null && !companyOfficialEmail.isBlank()) {
            return companyOfficialEmail;
        }
        return officialEmail;
    }

    public void setCompanyOfficialEmail(String companyOfficialEmail) {
        String normalized = companyOfficialEmail == null ? null : companyOfficialEmail.trim().toLowerCase();
        this.companyOfficialEmail = normalized;
        this.officialEmail = normalized;
    }

    public String getCompanyOfficialPasswordHash() {
        return companyOfficialPasswordHash;
    }

    public void setCompanyOfficialPasswordHash(String companyOfficialPasswordHash) {
        this.companyOfficialPasswordHash = companyOfficialPasswordHash;
    }

    public String getCompanyOfficialPassword() {
        return companyOfficialPassword;
    }

    public void setCompanyOfficialPassword(String companyOfficialPassword) {
        this.companyOfficialPassword = companyOfficialPassword;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getWebsite() {
        return website;
    }

    public void setWebsite(String website) {
        this.website = website;
    }

    public String getPlan() {
        return plan;
    }

    public void setPlan(String plan) {
        this.plan = plan;
    }

    public Integer getEmployeeLimit() {
        return employeeLimit;
    }

    public void setEmployeeLimit(Integer employeeLimit) {
        this.employeeLimit = employeeLimit;
    }

    public String getStorageLimit() {
        return storageLimit;
    }

    public void setStorageLimit(String storageLimit) {
        this.storageLimit = storageLimit;
    }

    public String getBillingCycle() {
        return billingCycle;
    }

    public void setBillingCycle(String billingCycle) {
        this.billingCycle = billingCycle;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public Integer getEmployees() {
        return employees;
    }

    public void setEmployees(Integer employees) {
        this.employees = employees;
    }

    public String getStorage() {
        return storage;
    }

    public void setStorage(String storage) {
        this.storage = storage;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDate getCreatedDate() {
        return createdDate;
    }

    public void setCreatedDate(LocalDate createdDate) {
        this.createdDate = createdDate;
    }

    public LocalDate getUpdatedDate() {
        return updatedDate;
    }

    public void setUpdatedDate(LocalDate updatedDate) {
        this.updatedDate = updatedDate;
    }

    public String getLogoPath() {
        return logoPath;
    }

    public void setLogoPath(String logoPath) {
        this.logoPath = logoPath;
    }

    public String getLogoUrl() {
        return logoUrl;
    }

    public void setLogoUrl(String logoUrl) {
        this.logoUrl = logoUrl;
    }

    public String getLogoContentType() {
        return logoContentType;
    }

    public void setLogoContentType(String logoContentType) {
        this.logoContentType = logoContentType;
    }

    public byte[] getLogoData() {
        return logoData;
    }

    public void setLogoData(byte[] logoData) {
        this.logoData = logoData;
    }

    // Alias field expected by some frontend payloads
    public String getCompanyLegalName() {
        return legalName;
    }

    public void setCompanyLegalName(String companyLegalName) {
        this.legalName = companyLegalName;
    }
}
