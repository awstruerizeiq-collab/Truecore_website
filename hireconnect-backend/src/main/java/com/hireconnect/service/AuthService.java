package com.hireconnect.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hireconnect.dto.request.ForgotPasswordRequest;
import com.hireconnect.dto.request.LoginRequest;
import com.hireconnect.dto.request.CompanyLoginRequest;
import com.hireconnect.dto.request.RegisterRequest;
import com.hireconnect.dto.request.ResetPasswordRequest;
import com.hireconnect.dto.response.AuthResponse;
import com.hireconnect.entity.Company;
import com.hireconnect.entity.CompanyRegistration;
import com.hireconnect.entity.EmployeeDetails;
import com.hireconnect.entity.GlobalAdmin;
import com.hireconnect.entity.User;
import com.hireconnect.entity.User.Role;
import com.hireconnect.repository.CompanyRegistrationRepository;
import com.hireconnect.repository.CompanyRepository;
import com.hireconnect.repository.EmployeeDetailsRepository;   // ✅ ADD
import com.hireconnect.repository.GlobalAdminRepository;
import com.hireconnect.repository.UserRepository;
import com.hireconnect.util.JwtUtil;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;

import org.springframework.security.core.authority.SimpleGrantedAuthority;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private CompanyRegistrationRepository companyRegistrationRepository;

    @Autowired
    private EmployeeDetailsRepository employeeDetailsRepository; // ✅ ADD

    @Autowired
    private GlobalAdminRepository globalAdminRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private EmailService emailService;

    @Value("${app.frontend.base-url:http://localhost:3000}")
    private String frontendBaseUrl;

    @Value("${app.base-url:http://localhost:8080}")
    private String appBaseUrl;

    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");

    /**
     * Register new employee with automatic tenant code mapping
     * tenantCode must be provided in RegisterRequest
     */
    public AuthResponse register(RegisterRequest request) {

        // 1. Validate tenant code is provided
        if (request.getTenantCode() == null || request.getTenantCode().trim().isEmpty()) {
            throw new RuntimeException("Tenant code is required for employee registration");
        }

        // 2. Verify company exists
        Company company = companyRepository.findByTenantCode(request.getTenantCode())
                .orElseThrow(() -> new RuntimeException("Invalid tenant code: Company not found"));

        // 3. Check if email already exists WITHIN THIS TENANT
        if (userRepository.existsByEmailAndTenantCode(request.getEmail(), request.getTenantCode())) {
            throw new RuntimeException("Email already registered for this company");
        }

        // 4. Check if employee ID is unique within tenant (if provided)
        if (request.getEmployeeId() != null &&
                userRepository.existsByEmployeeIdAndTenantCode(request.getEmployeeId(), request.getTenantCode())) {
            throw new RuntimeException("Employee ID already exists for this company");
        }

        // 5. Create new User with tenant mapping
        User user = new User();
        user.setEmail(request.getEmail());

        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setPlainPassword(request.getPassword());

        user.setFullName(request.getFullName());
        user.setEmployeeId(request.getEmployeeId());
        user.setMobile(request.getMobile());
        user.setDepartment(request.getDepartment());
        user.setDob(request.getDob());
        user.setJoiningDate(request.getJoiningDate());
        user.setPosition(request.getPosition());

        // tenant mapping
        user.setTenantCode(request.getTenantCode());
        user.setCompanyId(company.getId());
        user.setCompanyName(company.getDisplayName());

        // role handling
        User.Role role = normalizeRole(request.getRole());

        if (role == User.Role.ADMIN || role == User.Role.GLOBAL_ADMIN) {
            user.setIsAdmin(true);
        } else {
            user.setIsAdmin(false);
        }

        user.setRole(role);


        System.out.println("📋 User Registration Details:");
        System.out.println("   - Email: " + user.getEmail());
        System.out.println("   - Role: " + user.getRole().name());
        System.out.println("   - IsAdmin: " + user.getIsAdmin());
        System.out.println("   - TenantCode: " + user.getTenantCode());

        // status defaults
        user.setStatus(User.Status.ACTIVE);
        user.setOnboardingStatus(User.OnboardingStatus.NOT_STARTED);

        // save user
        User savedUser = userRepository.save(user);

        System.out.println("✅ User saved with ID: " + savedUser.getId());
        System.out.println("   - Role in DB: " + savedUser.getRole().name());
        System.out.println("   - IsAdmin in DB: " + savedUser.getIsAdmin());

        // update company employee count
        company.setEmployees(company.getEmployees() + 1);
        companyRepository.save(company);

        // generate token with role
        String token = jwtUtil.generateToken(
                new org.springframework.security.core.userdetails.User(
                        savedUser.getEmail(),
                        savedUser.getPassword(),
                        java.util.List.of(
                                new org.springframework.security.core.authority.SimpleGrantedAuthority(
                                        "ROLE_" + savedUser.getRole().name()
                                )
                        )
                )
        );

        // return response
        AuthResponse response = new AuthResponse(
                token,
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getFullName(),
                savedUser.getEmployeeId(),
                savedUser.getRole().name(),
                savedUser.getOnboardingStatus().name(),
                savedUser.getDob(),
                savedUser.getJoiningDate(),
                savedUser.getTenantCode(),
                savedUser.getCompanyName()
        );
        response.setCompanyId(savedUser.getCompanyId());
        enrichCompanyContext(response, savedUser.getCompanyId(), savedUser.getTenantCode());
        return response;
    }

    private Role normalizeRole(String role) {
        if (role == null || role.trim().isEmpty()) {
            return User.Role.EMPLOYEE;
        }

        String normalized = role.trim().toUpperCase(Locale.ROOT).replace(" ", "_");
        if ("TEAM_LEADER".equals(normalized)) {
            normalized = "TEAM_LEAD";
        } else if ("COMPANY_ADMIN".equals(normalized)) {
            normalized = "ADMIN";
        }

        try {
            return User.Role.valueOf(normalized);
        } catch (IllegalArgumentException ex) {
            return User.Role.EMPLOYEE;
        }
    }

	/**
     * ✅ FULL LOGIN FIX:
     * 1) Try USERS login first (ADMIN/EMPLOYEE from users table)
     * 2) If it fails, try EMPLOYEE_DETAILS login (TEAM_LEADER from employee_details table)
     */
    public AuthResponse login(LoginRequest request) {

        // ========= 1) TRY USERS TABLE LOGIN =========
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );

            User user = userRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            System.out.println("🔐 USERS Login Success:");
            System.out.println("   - Email: " + user.getEmail());
            System.out.println("   - Role: " + user.getRole().name());
            System.out.println("   - TenantCode: " + user.getTenantCode());

            String token = jwtUtil.generateToken(
                    new org.springframework.security.core.userdetails.User(
                            user.getEmail(),
                            user.getPassword(),
                            java.util.List.of(
                                    new org.springframework.security.core.authority.SimpleGrantedAuthority(
                                            "ROLE_" + user.getRole().name()
                                    )
                            )
                    )
            );

            user.setLastLoginAt(LocalDateTime.now());
            userRepository.save(user);

            AuthResponse response = new AuthResponse(
                    token,
                    user.getId(),
                    user.getEmail(),
                    user.getFullName(),
                    user.getEmployeeId(),
                    user.getRole().name(),
                    user.getOnboardingStatus().name(),
                    user.getDob(),
                    user.getJoiningDate(),
                    user.getTenantCode(),
                    user.getCompanyName()
            );
            response.setCompanyId(user.getCompanyId());
            enrichCompanyContext(response, user.getCompanyId(), user.getTenantCode());
            return response;

        } catch (Exception usersLoginFailed) {
            System.out.println("⚠️ USERS login failed, trying EMPLOYEE_DETAILS login...");
        }

        // ========= 2) TRY GLOBAL ADMIN LOGIN (global_admins table) =========
        String loginEmail = request.getEmail() == null ? "" : request.getEmail().trim();
        if (!loginEmail.isEmpty()) {
            GlobalAdmin admin = globalAdminRepository.findByEmailIgnoreCase(loginEmail).orElse(null);
            if (admin != null) {
                if (!passwordEncoder.matches(request.getPassword(), admin.getPassword())) {
                    throw new RuntimeException("Invalid email or password");
                }

                String token = jwtUtil.generateToken(
                        new org.springframework.security.core.userdetails.User(
                                admin.getEmail(),
                                admin.getPassword(),
                                List.of(new SimpleGrantedAuthority("ROLE_GLOBAL_ADMIN"))
                        )
                );

                AuthResponse response = new AuthResponse(
                        token,
                        admin.getId(),
                        admin.getEmail(),
                        admin.getFullName(),
                        null,
                        "GLOBAL_ADMIN",
                        "NOT_STARTED",
                        null,
                        null,
                        "GLOBAL",
                        "Global Admin"
                );
                return response;
            }
        }

        // ========= 3) TRY EMPLOYEE_DETAILS LOGIN (TEAM LEAD) =========
        EmployeeDetails emp = employeeDetailsRepository.findByOfficialEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        // NOTE: Your employee_details.officialPassword is currently plain text
        if (emp.getOfficialPassword() == null || !emp.getOfficialPassword().equals(request.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

//        String role = (emp.getRole() == null || emp.getRole().trim().isEmpty())
//                ? "EMPLOYEE"
//                : emp.getRole().trim().toUpperCase(); // TEAM_LEADER
        String role = (emp.getRole() == null || emp.getRole().trim().isEmpty())
                ? "EMPLOYEE"
                : emp.getRole().trim().toUpperCase().replace(" ", "_");


        System.out.println("✅ EMPLOYEE_DETAILS Login Success:");
        System.out.println("   - OfficialEmail: " + emp.getOfficialEmail());
        System.out.println("   - Role: " + role);
        System.out.println("   - TenantCode: " + emp.getTenantCode());
        System.out.println("   - EmployeeId: " + emp.getEmployeeId());

        String token = jwtUtil.generateToken(
                new org.springframework.security.core.userdetails.User(
                        emp.getOfficialEmail(),
                        emp.getOfficialPassword(),
                        java.util.List.of(
                                new org.springframework.security.core.authority.SimpleGrantedAuthority(
                                        "ROLE_" + role
                                )
                        )
                )
        );

        // Build AuthResponse from employee_details
        AuthResponse response = new AuthResponse(
                token,
                null, // not a users-table id
                emp.getOfficialEmail(),
                // if you have name in employee_details, replace below with emp.getName()
                (emp.getCompanyName() != null ? emp.getCompanyName() : "Team Lead"),
                emp.getEmployeeId(),
                role,
                "NOT_STARTED",
                null,
                (emp.getDateOfJoining() != null ? emp.getDateOfJoining().toString() : null),
                emp.getTenantCode(),
                emp.getCompanyName()
        );
        response.setCompanyId(emp.getCompanyId());
        enrichCompanyContext(response, emp.getCompanyId(), emp.getTenantCode());
        return response;
    }

    public Map<String, Object> companyLogin(CompanyLoginRequest request) {
        String tenantCode = request == null || request.getTenantCode() == null ? "" : request.getTenantCode().trim();
        String email = request == null || request.getCompanyOfficialEmail() == null
                ? ""
                : request.getCompanyOfficialEmail().trim().toLowerCase();
        String password = request == null || request.getCompanyOfficialPassword() == null
                ? ""
                : request.getCompanyOfficialPassword();

        if (tenantCode.isEmpty() || email.isEmpty() || password.isEmpty()) {
            throw new RuntimeException("Invalid credentials");
        }

        return companyRepository
                .findByTenantCodeAndCompanyOfficialEmail(tenantCode, email)
                .map(company -> buildCompanyLoginResponse(company, password))
                .orElseGet(() -> buildLegacyCompanyLoginResponse(tenantCode, email, password));
    }

    private Map<String, Object> buildCompanyLoginResponse(Company company, String password) {
        if (company.getCompanyOfficialPasswordHash() == null
                || !passwordEncoder.matches(password, company.getCompanyOfficialPasswordHash())) {
            throw new RuntimeException("Invalid credentials");
        }

        if (!"active".equalsIgnoreCase(company.getStatus())) {
            throw new RuntimeException("Invalid credentials");
        }

        Map<String, Object> claims = new HashMap<>();
        claims.put("tenantCode", company.getTenantCode());
        claims.put("role", "COMPANY_ADMIN");
        claims.put("companyId", company.getId());

        String token = jwtUtil.generateToken(
                new org.springframework.security.core.userdetails.User(
                        company.getCompanyOfficialEmail(),
                        company.getCompanyOfficialPasswordHash(),
                        java.util.List.of(
                                new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_COMPANY_ADMIN")
                        )
                ),
                claims
        );

        Map<String, Object> data = new HashMap<>();
        data.put("token", token);
        data.put("companyId", company.getId());
        data.put("tenantCode", company.getTenantCode());
        data.put("role", "COMPANY_ADMIN");
        data.put("displayName", company.getDisplayName());
        data.put("companyLegalName", company.getLegalName());
        data.put("companyOfficialEmail", company.getCompanyOfficialEmail());
        data.put("logoUrl", buildCompanyLogoUrl(company.getLogoPath()));
        data.put("logoPath", company.getLogoPath());
        return data;
    }

    private Map<String, Object> buildLegacyCompanyLoginResponse(String tenantCode, String email, String password) {
        CompanyRegistration company = companyRegistrationRepository.findByCompanyEmail(email);
        if (company == null) {
            throw new RuntimeException("Invalid credentials");
        }

        String storedKey = company.getCompanyKey() == null ? "" : company.getCompanyKey().trim();
        if (!storedKey.equalsIgnoreCase(tenantCode)) {
            throw new RuntimeException("Invalid credentials");
        }

        if (company.getPassword() == null || !passwordEncoder.matches(password, company.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        Map<String, Object> claims = new HashMap<>();
        claims.put("tenantCode", storedKey);
        claims.put("role", "COMPANY_ADMIN");
        claims.put("companyId", company.getId());

        String token = jwtUtil.generateToken(
                new org.springframework.security.core.userdetails.User(
                        company.getCompanyEmail(),
                        company.getPassword(),
                        java.util.List.of(
                                new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_COMPANY_ADMIN")
                        )
                ),
                claims
        );

        Map<String, Object> data = new HashMap<>();
        data.put("token", token);
        data.put("companyId", company.getId());
        data.put("tenantCode", storedKey);
        data.put("role", "COMPANY_ADMIN");
        data.put("displayName", company.getCompanyName());
        data.put("companyLegalName", company.getCompanyName());
        data.put("companyOfficialEmail", company.getCompanyEmail());
        data.put("logoUrl", null);
        data.put("logoPath", null);
        return data;
    }

    public User getCurrentUser() {
        org.springframework.security.core.Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Current user not found"));
    }

    public Map<String, Object> canSwitchToEmployeeDashboard(String authHeader) {
        if (authHeader == null || authHeader.trim().isEmpty()) {
            throw new RuntimeException("Authorization header is required");
        }

        String token = authHeader.trim();
        if (token.toLowerCase(Locale.ROOT).startsWith("bearer ")) {
            token = token.substring(7).trim();
        }

        if (token.isEmpty()) {
            throw new RuntimeException("Authorization header is required");
        }

        String username;
        try {
            username = jwtUtil.extractUsername(token);
            Date expiry = jwtUtil.extractExpiration(token);
            if (username == null || username.trim().isEmpty()) {
                throw new RuntimeException("Invalid or expired token");
            }
            if (expiry != null && expiry.before(new Date())) {
                throw new RuntimeException("Invalid or expired token");
            }
        } catch (Exception ex) {
            throw new RuntimeException("Invalid or expired token");
        }

        String rawRole = null;
        String lookupEmail = username.trim().toLowerCase(Locale.ROOT);
        User user = userRepository.findByEmailIgnoreCase(lookupEmail).orElse(null);
        if (user != null && user.getRole() != null) {
            rawRole = user.getRole().name();
        } else {
            EmployeeDetails employee = employeeDetailsRepository.findByOfficialEmail(lookupEmail).orElse(null);
            if (employee != null) {
                rawRole = employee.getRole();
            }
        }

        String normalizedRole = normalizeSwitchRole(rawRole);
        boolean allowed =
                "ADMIN".equals(normalizedRole) ||
                "TEAM_LEAD".equals(normalizedRole) ||
                "TEAM_LEADER".equals(normalizedRole);

        Map<String, Object> payload = new HashMap<>();
        payload.put("allowed", allowed);
        payload.put("role", normalizedRole);
        return payload;
    }

    private String normalizeSwitchRole(String role) {
        if (role == null) {
            return "";
        }
        String normalized = role.trim().toUpperCase(Locale.ROOT).replace(" ", "_");
        if ("TEAMLEAD".equals(normalized)) {
            return "TEAM_LEAD";
        }
        if ("TEAM_LEADER".equals(normalized)) {
            return "TEAM_LEADER";
        }
        return normalized;
    }

    public void forgotPassword(ForgotPasswordRequest request) {
        String email = request != null && request.getEmail() != null ? request.getEmail().trim() : "";
        String roleRaw = request != null && request.getRole() != null ? request.getRole().trim() : "";

        if (email.isEmpty() || !EMAIL_PATTERN.matcher(email).matches()) {
            throw new RuntimeException("Invalid email format");
        }

        User.Role role = parseRole(roleRaw);
        if (role == null) {
            throw new RuntimeException("Invalid role");
        }

        userRepository.findByEmail(email).ifPresent(user -> {
            if (!isRoleMatch(user, role)) {
                return;
            }

            String token = UUID.randomUUID().toString();
            user.setResetPasswordToken(token);
            user.setResetPasswordExpire(LocalDateTime.now().plusHours(1));
            userRepository.save(user);

            String base = frontendBaseUrl == null ? "http://localhost:3000" : frontendBaseUrl;
            String resetLink = base.replaceAll("/+$", "") + "/reset-password?token=" + token;
            emailService.sendPasswordResetEmail(user.getEmail(), resetLink);
        });
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String token = request != null && request.getToken() != null ? request.getToken().trim() : "";
        String newPassword = request != null && request.getNewPassword() != null ? request.getNewPassword() : "";

        if (token.isEmpty() || newPassword.isEmpty()) {
            throw new RuntimeException("Token and new password are required");
        }

        User user = userRepository
                .findByResetPasswordTokenAndResetPasswordExpireAfter(token, LocalDateTime.now())
                .orElseThrow(() -> new RuntimeException("Invalid or expired token"));

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setPlainPassword(newPassword);
        user.setResetPasswordToken(null);
        user.setResetPasswordExpire(null);
        userRepository.save(user);
        syncOfficialPasswordForUser(user.getId(), newPassword);
    }

    private User.Role parseRole(String roleRaw) {
        if (roleRaw == null || roleRaw.isEmpty()) {
            return null;
        }
        String normalized = roleRaw.toUpperCase(Locale.ROOT);
        try {
            return User.Role.valueOf(normalized);
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private boolean isRoleMatch(User user, User.Role role) {
        if (role == User.Role.ADMIN) {
            return user.getRole() == User.Role.ADMIN || Boolean.TRUE.equals(user.getIsAdmin());
        }
        return user.getRole() == role;
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

    private void enrichCompanyContext(AuthResponse response, Long companyId, String tenantCode) {
        Company company = null;

        if (companyId != null) {
            company = companyRepository.findById(companyId).orElse(null);
        }

        if (company == null && tenantCode != null && !tenantCode.trim().isEmpty()) {
            company = companyRepository.findByTenantCode(tenantCode).orElse(null);
        }

        if (company == null) {
            return;
        }

        response.setCompanyId(company.getId());
        response.setTenantCode(company.getTenantCode());
        response.setCompanyName(company.getDisplayName());
        response.setCompanyLegalName(company.getLegalName());
        response.setLogoUrl(buildCompanyLogoUrl(company.getLogoPath()));
    }

    private String buildCompanyLogoUrl(String logoPath) {
        if (logoPath == null || logoPath.isBlank()) {
            return null;
        }

        if (logoPath.startsWith("http://") || logoPath.startsWith("https://")) {
            return logoPath;
        }

        String base = appBaseUrl == null ? "http://localhost:8080" : appBaseUrl.replaceAll("/+$", "");
        if (logoPath.startsWith("/")) {
            return base + logoPath;
        }
        return base + "/uploads/company-logos/" + logoPath;
    }
    
}
