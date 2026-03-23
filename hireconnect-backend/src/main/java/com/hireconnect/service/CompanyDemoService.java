package com.hireconnect.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hireconnect.dto.request.CompanyDemoLoginRequest;
import com.hireconnect.dto.request.CompanyDemoRequest;
import com.hireconnect.dto.request.CompanyDemoUpdateRequest;
import com.hireconnect.dto.request.CompanyRegistrationLoginRequest;
import com.hireconnect.dto.request.CompanyRegistrationRequest;
import com.hireconnect.dto.response.CompanyDemoResponse;
import com.hireconnect.dto.response.CompanyRegistrationResponse;
import com.hireconnect.entity.CompanyDemoDetails;
import com.hireconnect.entity.CompanyDemoDetails.DemoStatus;
import com.hireconnect.entity.CompanyRegistration;
import com.hireconnect.repository.CompanyDemoRepository;
import com.hireconnect.repository.CompanyRegistrationRepository;
import com.hireconnect.security.JwtService;

@Service
public class CompanyDemoService {

    private final CompanyDemoRepository companyDemoRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final CompanyRegistrationRepository companyRegistrationRepository;
    private final EmailService emailService;

    // ✅ NEW: Activity Log
    private final ActivityLogService activityLogService;

    @Autowired
    public CompanyDemoService(
            CompanyDemoRepository companyDemoRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            CompanyRegistrationRepository companyRegistrationRepository,
            EmailService emailService,
            ActivityLogService activityLogService
    ) {
        this.companyDemoRepository = companyDemoRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.companyRegistrationRepository = companyRegistrationRepository;
        this.emailService = emailService;
        this.activityLogService = activityLogService;
    }

    // -------------------- DEMO REGISTER --------------------
    @Transactional
    public CompanyDemoResponse register(CompanyDemoRequest request) {
        // Validate request
        validateRegistrationRequest(request);

        // Check if email already exists
        if (companyDemoRepository.existsByCompanyEmail(request.getCompanyEmail())) {
            throw new RuntimeException("Company email already registered");
        }

        // Create new company demo details
        CompanyDemoDetails company = new CompanyDemoDetails();
        company.setFullName(request.getFullName());
        company.setCompanyEmail(request.getCompanyEmail());
        company.setPhoneNumber(request.getPhoneNumber());
        company.setCompanyName(request.getCompanyName());
        company.setDesignation(request.getDesignation());
        company.setPassword(passwordEncoder.encode(request.getPassword()));
        company.setStatus(DemoStatus.PENDING);

        // Save to database
        CompanyDemoDetails savedCompany = companyDemoRepository.save(company);

        // ✅ ACTIVITY LOG: DEMO REQUEST CREATED
        safeLog(
                "DEMO_REQUEST_CREATED",
                "New demo request from " + safe(savedCompany.getCompanyName())
                        + " (" + safe(savedCompany.getCompanyEmail()) + ")",
                "info",
                "Demo",
                null,   // companyId not available for demo request
                null,   // tenantCode not available for demo request
                null,
                savedCompany.getFullName()
        );

        // Send email notifications
        try {
            emailService.sendDemoRegistrationEmail(savedCompany);
            emailService.sendDemoConfirmationToUser(savedCompany);
        } catch (Exception e) {
            System.err.println("Failed to send email notifications: " + e.getMessage());
        }

        return convertToResponse(savedCompany);
    }

    // -------------------- COMPANY REGISTER --------------------
    @Transactional
    public CompanyRegistrationResponse registerCompany(CompanyRegistrationRequest request) {
        validateRegistrationRequest(request);

        if (companyRegistrationRepository.existsByCompanyEmail(request.getCompanyEmail())) {
            throw new RuntimeException("Company email already registered");
        }

        CompanyRegistration company = new CompanyRegistration();
        company.setCompanyEmail(request.getCompanyEmail());
        company.setCompanyName(request.getCompanyName());
        company.setPassword(passwordEncoder.encode(request.getPassword()));
        company.setCompanyKey(request.getCompanyKey());

        if (request.getPosition() != null && !request.getPosition().isEmpty()) {
            try {
                company.setPosition(
                        CompanyRegistration.role.valueOf(request.getPosition().toUpperCase())
                );
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Invalid role: " + request.getPosition());
            }
        }

        CompanyRegistration savedCompany = companyRegistrationRepository.save(company);

        // ✅ ACTIVITY LOG: COMPANY REGISTERED (optional but useful)
        safeLog(
                "COMPANY_REGISTERED",
                "Company registered: " + safe(savedCompany.getCompanyName())
                        + " (" + safe(savedCompany.getCompanyEmail()) + ")",
                "success",
                "Company",
                null,
                null,
                null,
                savedCompany.getCompanyName()
        );

        return convertToResponse(savedCompany);
    }

    // -------------------- COMPANY LOGIN --------------------
    public CompanyRegistrationResponse loginRegisteredCompany(CompanyRegistrationLoginRequest request) {
        if (request.getCompanyEmail() == null || request.getCompanyEmail().trim().isEmpty()) {
            throw new RuntimeException("Invalid credentials");
        }
        if (request.getCompanyKey() == null || request.getCompanyKey().trim().isEmpty()) {
            throw new RuntimeException("Invalid credentials");
        }

        CompanyRegistration company = companyRegistrationRepository.findByCompanyEmail(request.getCompanyEmail());
        if (company == null) throw new RuntimeException("Invalid credentials");

        if (!request.getCompanyKey().equals(company.getCompanyKey())) {
            throw new RuntimeException("Invalid credentials");
        }

        String token = jwtService.generateToken(company.getCompanyEmail());

        // ✅ ACTIVITY LOG: COMPANY LOGIN (optional)
        safeLog(
                "COMPANY_LOGIN",
                "Company login: " + safe(company.getCompanyName()),
                "info",
                "Auth",
                null,
                null,
                null,
                company.getCompanyName()
        );

        CompanyRegistrationResponse response = convertToResponse(company);
        response.setToken(token);
        return response;
    }

    // -------------------- DEMO LOGIN --------------------
    public CompanyDemoResponse login(CompanyDemoLoginRequest request) {
        if (request.getCompanyEmail() == null || request.getCompanyEmail().trim().isEmpty()) {
            throw new RuntimeException("Invalid email or password");
        }
        if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
            throw new RuntimeException("Invalid email or password");
        }

        CompanyDemoDetails company = companyDemoRepository.findByCompanyEmail(request.getCompanyEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        // ✅ IMPORTANT: verify password (your old code was not checking)
        if (!passwordEncoder.matches(request.getPassword(), company.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        String token = jwtService.generateToken(company.getCompanyEmail());

        // ✅ ACTIVITY LOG: DEMO LOGIN (optional)
        safeLog(
                "DEMO_LOGIN",
                "Demo login: " + safe(company.getCompanyName()),
                "info",
                "Auth",
                null,
                null,
                null,
                company.getFullName()
        );

        CompanyDemoResponse response = convertToResponse(company);
        response.setToken(token);
        return response;
    }

    // -------------------- READ --------------------
    public List<CompanyDemoResponse> getAllCompanies() {
        List<CompanyDemoDetails> companies = companyDemoRepository.findAllOrderByCreatedAtDesc();
        return companies.stream().map(this::convertToResponse).collect(Collectors.toList());
    }

    public CompanyDemoResponse getCompanyById(Long id) {
        CompanyDemoDetails company = companyDemoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Company not found with ID: " + id));
        return convertToResponse(company);
    }

    public List<CompanyDemoResponse> getCompaniesByStatus(String status) {
        try {
            DemoStatus demoStatus = DemoStatus.valueOf(status.toUpperCase());
            List<CompanyDemoDetails> companies = companyDemoRepository.findByStatus(demoStatus);
            return companies.stream().map(this::convertToResponse).collect(Collectors.toList());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid status: " + status);
        }
    }

    public List<CompanyRegistrationResponse> getAllRegisteredCompanies() {
        List<CompanyRegistration> companies = companyRegistrationRepository.findAll();
        return companies.stream().map(this::convertToResponse).collect(Collectors.toList());
    }

    public List<CompanyDemoResponse> searchCompaniesByName(String companyName) {
        List<CompanyDemoDetails> companies =
                companyDemoRepository.findByCompanyNameContainingIgnoreCase(companyName);
        return companies.stream().map(this::convertToResponse).collect(Collectors.toList());
    }

    // -------------------- UPDATE FULL DETAILS --------------------
    @Transactional
    public CompanyDemoResponse updateCompany(Long id, CompanyDemoUpdateRequest request) {
        CompanyDemoDetails company = companyDemoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Company not found with ID: " + id));

        String beforeStatus = company.getStatus() != null ? company.getStatus().name() : "-";

        if (request.getFullName() != null && !request.getFullName().isEmpty()) {
            company.setFullName(request.getFullName());
        }
        if (request.getPhoneNumber() != null && !request.getPhoneNumber().isEmpty()) {
            company.setPhoneNumber(request.getPhoneNumber());
        }
        if (request.getCompanyName() != null && !request.getCompanyName().isEmpty()) {
            company.setCompanyName(request.getCompanyName());
        }
        if (request.getDesignation() != null && !request.getDesignation().isEmpty()) {
            company.setDesignation(request.getDesignation());
        }
        if (request.getStatus() != null && !request.getStatus().isEmpty()) {
            try {
                company.setStatus(DemoStatus.valueOf(request.getStatus().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Invalid status: " + request.getStatus());
            }
        }
        if (request.getRemarks() != null) {
            company.setRemarks(request.getRemarks());
        }

        CompanyDemoDetails updatedCompany = companyDemoRepository.save(company);

        // ✅ ACTIVITY LOG: DEMO UPDATED
        safeLog(
                "DEMO_REQUEST_UPDATED",
                "Demo request updated for " + safe(updatedCompany.getCompanyName())
                        + " (status: " + safe(beforeStatus) + " → " + safe(updatedCompany.getStatus().name()) + ")",
                "info",
                "Demo",
                null,
                null,
                null,
                updatedCompany.getFullName()
        );

        return convertToResponse(updatedCompany);
    }

    // -------------------- UPDATE STATUS --------------------
    @Transactional
    public CompanyDemoResponse updateStatus(Long id, String status, String remarks) {
        CompanyDemoDetails company = companyDemoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Company not found with ID: " + id));

        String beforeStatus = company.getStatus() != null ? company.getStatus().name() : "-";

        try {
            company.setStatus(DemoStatus.valueOf(status.toUpperCase()));
            if (remarks != null && !remarks.isEmpty()) {
                company.setRemarks(remarks);
            }

            CompanyDemoDetails updatedCompany = companyDemoRepository.save(company);

            // choose severity based on status
            String sev = "warning";
            String up = updatedCompany.getStatus() != null ? updatedCompany.getStatus().name() : "";
            if ("APPROVED".equalsIgnoreCase(up) || "DEMO_COMPLETED".equalsIgnoreCase(up) || "CONVERTED".equalsIgnoreCase(up)) {
                sev = "success";
            } else if ("REJECTED".equalsIgnoreCase(up)) {
                sev = "danger";
            }

            // ✅ ACTIVITY LOG: STATUS UPDATED
            safeLog(
                    "DEMO_STATUS_UPDATED",
                    "Demo request status changed (" + safe(beforeStatus) + " → " + safe(updatedCompany.getStatus().name())
                            + ") for " + safe(updatedCompany.getCompanyName()),
                    sev,
                    "Demo",
                    null,
                    null,
                    null,
                    updatedCompany.getFullName()
            );

            return convertToResponse(updatedCompany);

        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid status: " + status);
        }
    }

    // -------------------- DELETE --------------------
    @Transactional
    public void deleteCompany(Long id) {
        CompanyDemoDetails company = companyDemoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Company not found with ID: " + id));

        companyDemoRepository.delete(company);

        // ✅ ACTIVITY LOG: DEMO DELETED
        safeLog(
                "DEMO_REQUEST_DELETED",
                "Demo request deleted for " + safe(company.getCompanyName()),
                "danger",
                "Demo",
                null,
                null,
                null,
                company.getFullName()
        );
    }

    // -------------------- STATS --------------------
    public Map<String, Object> getStatistics() {
        Map<String, Object> stats = new HashMap<>();

        long totalCompanies = companyDemoRepository.count();
        long pendingCount = companyDemoRepository.countByStatus(DemoStatus.PENDING);
        long approvedCount = companyDemoRepository.countByStatus(DemoStatus.APPROVED);
        long rejectedCount = companyDemoRepository.countByStatus(DemoStatus.REJECTED);
        long demoScheduledCount = companyDemoRepository.countByStatus(DemoStatus.DEMO_SCHEDULED);
        long demoCompletedCount = companyDemoRepository.countByStatus(DemoStatus.DEMO_COMPLETED);
        long convertedCount = companyDemoRepository.countByStatus(DemoStatus.CONVERTED);

        stats.put("totalCompanies", totalCompanies);
        stats.put("pending", pendingCount);
        stats.put("approved", approvedCount);
        stats.put("rejected", rejectedCount);
        stats.put("demoScheduled", demoScheduledCount);
        stats.put("demoCompleted", demoCompletedCount);
        stats.put("converted", convertedCount);

        return stats;
    }

    // -------------------- VALIDATIONS --------------------
    private void validateRegistrationRequest(CompanyDemoRequest request) {
        if (request.getFullName() == null || request.getFullName().trim().isEmpty()) {
            throw new RuntimeException("Full name is required");
        }
        if (request.getCompanyEmail() == null || request.getCompanyEmail().trim().isEmpty()) {
            throw new RuntimeException("Company email is required");
        }
        if (request.getPhoneNumber() == null || request.getPhoneNumber().trim().isEmpty()) {
            throw new RuntimeException("Phone number is required");
        }
        if (request.getCompanyName() == null || request.getCompanyName().trim().isEmpty()) {
            throw new RuntimeException("Company name is required");
        }
        if (request.getDesignation() == null || request.getDesignation().trim().isEmpty()) {
            throw new RuntimeException("Designation is required");
        }
        if (request.getPassword() == null || request.getPassword().length() < 6) {
            throw new RuntimeException("Password must be at least 6 characters");
        }
        if (!request.getCompanyEmail().matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
            throw new RuntimeException("Invalid email format");
        }
    }

    private void validateRegistrationRequest(CompanyRegistrationRequest request) {
        if (request.getCompanyEmail() == null || request.getCompanyEmail().trim().isEmpty()) {
            throw new RuntimeException("Company email is required");
        }
        if (request.getCompanyName() == null || request.getCompanyName().trim().isEmpty()) {
            throw new RuntimeException("Company name is required");
        }
        if (request.getPassword() == null || request.getPassword().length() < 6) {
            throw new RuntimeException("Password must be at least 6 characters");
        }
        if (request.getCompanyKey() == null || request.getCompanyKey().length() < 6) {
            throw new RuntimeException("Password must be at least 6 characters");
        }
        if (!request.getCompanyEmail().matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
            throw new RuntimeException("Invalid email format");
        }
    }

    // -------------------- DTO MAPPERS --------------------
    private CompanyDemoResponse convertToResponse(CompanyDemoDetails company) {
        CompanyDemoResponse response = new CompanyDemoResponse();
        response.setId(company.getId());
        response.setFullName(company.getFullName());
        response.setCompanyEmail(company.getCompanyEmail());
        response.setPhoneNumber(company.getPhoneNumber());
        response.setCompanyName(company.getCompanyName());
        response.setDesignation(company.getDesignation());
        response.setStatus(company.getStatus().name());
        response.setCreatedAt(company.getCreatedAt());
        response.setUpdatedAt(company.getUpdatedAt());
        response.setRemarks(company.getRemarks());
        return response;
    }

    private CompanyRegistrationResponse convertToResponse(CompanyRegistration company) {
        CompanyRegistrationResponse response = new CompanyRegistrationResponse();
        response.setId(company.getId());
        response.setCompanyEmail(company.getCompanyEmail());
        response.setCompanyName(company.getCompanyName());
        response.setPassword(company.getPassword());
        response.setCompanyKey(company.getCompanyKey());
        response.setPosition(company.getPosition().name());
        return response;
    }

    // -------------------- ACTIVITY LOG HELPERS --------------------
    private void safeLog(String eventType, String message, String severity, String tag,
                         Long companyId, String tenantCode, Long actorUserId, String actorName) {
        try {
            activityLogService.log(eventType, message, severity, tag, companyId, tenantCode, actorUserId, actorName);
        } catch (Exception e) {
            System.out.println("ActivityLog failed: " + e.getMessage());
        }
    }

    private String safe(String v) {
        return (v == null || v.trim().isEmpty()) ? "-" : v.trim();
    }
}
