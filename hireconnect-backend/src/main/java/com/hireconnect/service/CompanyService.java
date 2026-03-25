package com.hireconnect.service;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.hireconnect.entity.Company;
import com.hireconnect.repository.CompanyRepository;
import com.hireconnect.util.FileStorageUtil;

@Service
@Transactional
public class CompanyService {

    @Autowired
    private CompanyRepository repo;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // ✅ ADD THIS
    @Autowired
    private ActivityLogService activityLogService;

    @Autowired
    private UserService userService;

    @Autowired
    private FileStorageService fileStorageService;

    @Value("${file.company-logo-upload-dir:${file.upload-dir:uploads/company-logos}}")
    private String companyLogoUploadDir;

    @Value("${file.company-logo-storage:database}")
    private String companyLogoStorage;

    @Value("${app.base-url:http://localhost:8080}")
    private String appBaseUrl;

    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");

    public Company createCompany(Company company) {
        // Validate display name uniqueness
        if (company.getDisplayName() != null && repo.existsByDisplayName(company.getDisplayName())) {
            throw new RuntimeException("Company with display name '" + company.getDisplayName() + "' already exists");
        }

        // Validate admin email uniqueness
        if (company.getAdminEmail() != null && repo.existsByAdminEmail(company.getAdminEmail())) {
            throw new RuntimeException("Admin email '" + company.getAdminEmail() + "' already exists");
        }

        // Validate tenant code uniqueness
        if (company.getTenantCode() != null && repo.existsByTenantCode(company.getTenantCode())) {
            throw new RuntimeException("Tenant code '" + company.getTenantCode() + "' already exists");
        }

        validateAndPrepareCompanyAuth(company);

        // Set default values if not provided
        if (company.getCreatedDate() == null) company.setCreatedDate(LocalDate.now());
        if (company.getUpdatedDate() == null) company.setUpdatedDate(LocalDate.now());
        if (company.getEmployees() == null) company.setEmployees(0);
        if (company.getStorage() == null) company.setStorage("0 GB");
        if (company.getStatus() == null) company.setStatus("active");
        if (company.getRole() == null) company.setRole("COMPANY_ADMIN");
        if (company.getPlan() == null) company.setPlan("Basic");
        if (company.getEmployeeLimit() == null) company.setEmployeeLimit(50);
        if (company.getStorageLimit() == null) company.setStorageLimit("10 GB");
        if (company.getBillingCycle() == null) company.setBillingCycle("monthly");

        Company saved = repo.save(company);

        // ✅ ACTIVITY LOG
        safeLog(
            "COMPANY_CREATED",
            "New company " + safe(saved.getDisplayName()) + " registered",
            "success",
            "Company",
            saved.getId(),
            saved.getTenantCode(),
            null,
            saved.getAdmin()
        );

        return sanitizeSensitiveFields(enrichCompany(saved));
    }

    public Company createCompany(Company company, MultipartFile logo) {
        Company saved = createCompany(company);
        if (logo != null && !logo.isEmpty()) {
            storeCompanyLogo(saved, logo);
            saved = repo.save(saved);
        }
        return sanitizeSensitiveFields(enrichCompany(saved));
    }

    public List<Company> getAll() {
        List<Company> companies = repo.findAll();
        companies.forEach(this::enrichCompany);
        companies.forEach(this::sanitizeSensitiveFields);
        return companies;
    }

    public Company getById(Long id) {
        Company company = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Company not found with ID: " + id));
        return sanitizeSensitiveFields(enrichCompany(company));
    }

    public Company update(Long id, Company data) {
        Company c = getById(id);

        // Check for conflicts with other companies (excluding current company)
        if (data.getDisplayName() != null &&
            !c.getDisplayName().equals(data.getDisplayName()) &&
            repo.existsByDisplayName(data.getDisplayName())) {
            throw new RuntimeException("Company with display name '" + data.getDisplayName() + "' already exists");
        }

        if (data.getAdminEmail() != null &&
            !c.getAdminEmail().equals(data.getAdminEmail()) &&
            repo.existsByAdminEmail(data.getAdminEmail())) {
            throw new RuntimeException("Admin email '" + data.getAdminEmail() + "' already exists");
        }

        if (data.getTenantCode() != null &&
            !c.getTenantCode().equals(data.getTenantCode()) &&
            repo.existsByTenantCode(data.getTenantCode())) {
            throw new RuntimeException("Tenant code '" + data.getTenantCode() + "' already exists");
        }

        // Update Basic Info
        if (data.getLegalName() != null) c.setLegalName(data.getLegalName());
        if (data.getDisplayName() != null) c.setDisplayName(data.getDisplayName());
        if (data.getTenantCode() != null) c.setTenantCode(data.getTenantCode());
        if (data.getOrganizationType() != null) c.setOrganizationType(data.getOrganizationType());
        if (data.getIndustry() != null) c.setIndustry(data.getIndustry());
        if (data.getGstNo() != null) c.setGstNo(data.getGstNo());

        // Update Admin Details
        if (data.getAdmin() != null) c.setAdmin(data.getAdmin());
        if (data.getAdminEmail() != null) c.setAdminEmail(data.getAdminEmail());
        if (data.getMobileNumber() != null) c.setMobileNumber(data.getMobileNumber());
        if (data.getRole() != null) c.setRole(data.getRole());

        // Update Contact Information
        if (data.getAddress() != null) c.setAddress(data.getAddress());
        if (data.getCity() != null) c.setCity(data.getCity());
        if (data.getState() != null) c.setState(data.getState());
        if (data.getCountry() != null) c.setCountry(data.getCountry());
        if (data.getPincode() != null) c.setPincode(data.getPincode());
        if (data.getOfficialEmail() != null) c.setOfficialEmail(data.getOfficialEmail());
        if (data.getPhoneNumber() != null) c.setPhoneNumber(data.getPhoneNumber());
        if (data.getWebsite() != null) c.setWebsite(data.getWebsite());

        // Update Subscription Details
        if (data.getPlan() != null) c.setPlan(data.getPlan());
        if (data.getEmployeeLimit() != null) c.setEmployeeLimit(data.getEmployeeLimit());
        if (data.getStorageLimit() != null) c.setStorageLimit(data.getStorageLimit());
        if (data.getBillingCycle() != null) c.setBillingCycle(data.getBillingCycle());
        if (data.getStartDate() != null) c.setStartDate(data.getStartDate());
        if (data.getStatus() != null) c.setStatus(data.getStatus());

        c.setUpdatedDate(LocalDate.now());

        Company updated = repo.save(c);

        // ✅ ACTIVITY LOG
        safeLog(
            "COMPANY_UPDATED",
            "Company " + safe(updated.getDisplayName()) + " updated",
            "info",
            "Company",
            updated.getId(),
            updated.getTenantCode(),
            null,
            updated.getAdmin()
        );

        return sanitizeSensitiveFields(enrichCompany(updated));
    }

    public void delete(Long id) {
        Company c = getById(id); // get details before deleting
        String tenantCode = c.getTenantCode() == null ? null : c.getTenantCode().trim();

        int deletedEmployees = 0;
        if (tenantCode != null && !tenantCode.isEmpty()) {
            deletedEmployees = userService.hardDeleteUsersByTenantCode(tenantCode);
        }

        repo.deleteById(id);

        // ✅ ACTIVITY LOG
        safeLog(
            "COMPANY_DELETED",
            "Company " + safe(c.getDisplayName()) + " deleted; removed " + deletedEmployees + " tenant users",
            "danger",
            "Company",
            c.getId(),
            c.getTenantCode(),
            null,
            c.getAdmin()
        );
    }

    public Company toggleStatus(Long id) {
        Company c = getById(id);

        String newStatus = "active".equalsIgnoreCase(c.getStatus()) ? "suspended" : "active";
        c.setStatus(newStatus);
        c.setUpdatedDate(LocalDate.now());

        Company saved = repo.save(c);

        // ✅ ACTIVITY LOG
        safeLog(
            "COMPANY_STATUS_CHANGED",
            "Company " + safe(saved.getDisplayName()) + " status changed to " + safe(saved.getStatus()),
            "warning",
            "Company",
            saved.getId(),
            saved.getTenantCode(),
            null,
            saved.getAdmin()
        );

        return sanitizeSensitiveFields(enrichCompany(saved));
    }

    public List<Company> searchCompanies(String searchTerm) {
        return repo.searchCompanies(searchTerm);
    }

    public List<Company> getCompaniesByStatus(String status) {
        return repo.findByStatus(status);
    }

    public Map<String, Object> getStatistics() {
        Long totalCompanies = repo.count();
        Long activeCompanies = repo.countByStatus("active");
        Long suspendedCompanies = repo.countByStatus("suspended");
        Long totalEmployees = repo.getTotalEmployees();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalCompanies", totalCompanies != null ? totalCompanies : 0);
        stats.put("activeCompanies", activeCompanies != null ? activeCompanies : 0);
        stats.put("suspendedCompanies", suspendedCompanies != null ? suspendedCompanies : 0);
        stats.put("totalEmployees", totalEmployees != null ? totalEmployees : 0);

        return stats;
    }

    public Optional<Company> findByOfficialEmailAndTenantCode(String officialEmail, String tenantCode) {
        String normalizedEmail = normalizeEmail(officialEmail);
        String normalizedTenant = tenantCode == null ? null : tenantCode.trim();

        Optional<Company> companyOpt = repo.findByTenantCodeAndCompanyOfficialEmail(normalizedTenant, normalizedEmail);
        if (companyOpt.isEmpty()) {
            companyOpt = repo.findByOfficialEmailAndTenantCode(normalizedEmail, normalizedTenant);
        }

        // ✅ Optional: log company login success
        if (companyOpt.isPresent()) {
            Company c = companyOpt.get();
            safeLog(
                "COMPANY_LOGIN",
                "Company login: " + safe(c.getDisplayName()),
                "info",
                "Auth",
                c.getId(),
                c.getTenantCode(),
                null,
                c.getAdmin()
            );
        }

        companyOpt.ifPresent(c -> sanitizeSensitiveFields(enrichCompany(c)));
        return companyOpt;
    }

    // -------------------- helpers --------------------

    private void safeLog(String eventType, String message, String severity, String tag,
                         Long companyId, String tenantCode, Long actorUserId, String actorName) {
        try {
            activityLogService.log(eventType, message, severity, tag, companyId, tenantCode, actorUserId, actorName);
        } catch (Exception e) {
            // do not break main flow if logging fails
            System.out.println("ActivityLog failed: " + e.getMessage());
        }
    }

    private String safe(String v) {
        return (v == null || v.trim().isEmpty()) ? "-" : v.trim();
    }

    private Company enrichCompany(Company company) {
        company.setLogoUrl(buildLogoUrl(company.getLogoPath()));
        return company;
    }

    private Company sanitizeSensitiveFields(Company company) {
        company.setCompanyOfficialPassword(null);
        return company;
    }

    private String buildLogoUrl(String logoPath) {
        if (logoPath == null || logoPath.isBlank()) return null;
        String base = appBaseUrl == null ? "http://localhost:8080" : appBaseUrl.replaceAll("/+$", "");
        if (logoPath.startsWith("/")) {
            return base + logoPath;
        }
        return base + "/uploads/company-logos/" + logoPath;
    }

    public ResponseEntity<Resource> getCompanyLogo(Long companyId) {
        Company company = repo.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Company not found with ID: " + companyId));
        return FileStorageUtil.buildResponse(
                company.getLogoData(),
                buildLegacyLogoPath(company.getLogoPath()),
                company.getLogoContentType(),
                "company-logo",
                false
        );
    }

    private void storeCompanyLogo(Company company, MultipartFile logo) {
        try {
            company.setLogoData(logo.getBytes());
            company.setLogoContentType(logo.getContentType());
            if ("filesystem".equalsIgnoreCase(companyLogoStorage)) {
                String storedPath = fileStorageService.store(logo, "company-logos", "company-logo-" + company.getId());
                company.setLogoPath(storedPath);
            } else {
                company.setLogoPath("/api/companies/" + company.getId() + "/logo");
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to store company logo: " + e.getMessage(), e);
        }
    }

    private String buildLegacyLogoPath(String logoPath) {
        if (logoPath == null || logoPath.isBlank() || logoPath.startsWith("/")) {
            return null;
        }
        return companyLogoUploadDir + "/" + logoPath;
    }

    private void validateAndPrepareCompanyAuth(Company company) {
        String tenantCode = company.getTenantCode() == null ? "" : company.getTenantCode().trim();
        String email = normalizeEmail(company.getCompanyOfficialEmail() != null
                ? company.getCompanyOfficialEmail()
                : company.getOfficialEmail());
        String rawPassword = company.getCompanyOfficialPassword();

        if (email == null || email.isBlank() || !EMAIL_PATTERN.matcher(email).matches()) {
            throw new RuntimeException("Company official email is required and must be valid");
        }
        if (rawPassword == null || rawPassword.trim().length() < 8) {
            throw new RuntimeException("Company official password must be at least 8 characters");
        }

        if (!tenantCode.isBlank() && repo.existsByCompanyOfficialEmailAndTenantCode(email, tenantCode)) {
            throw new RuntimeException("Company official email already exists for this tenant code");
        }

        company.setCompanyOfficialEmail(email);
        company.setOfficialEmail(email);
        company.setCompanyOfficialPasswordHash(passwordEncoder.encode(rawPassword.trim()));
        company.setCompanyOfficialPassword(null);
    }

    private String normalizeEmail(String email) {
        if (email == null) {
            return null;
        }
        return email.trim().toLowerCase();
    }
}
