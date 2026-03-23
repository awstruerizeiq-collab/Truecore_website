package com.hireconnect.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.hireconnect.entity.User;
import com.hireconnect.repository.UserRepository;

@Component
public class GlobalAdminInitializer implements CommandLineRunner {

    private static final String DEFAULT_NAME = "Global Admin";
    private static final String DEFAULT_EMAIL = "truecorehr@truerize.com";
    private static final String DEFAULT_PASSWORD = "TruecoreHR@2026";
    private static final String DEFAULT_TENANT_CODE = "GLOBAL";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public GlobalAdminInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        boolean roleExists = userRepository.countActiveByRole(User.Role.GLOBAL_ADMIN) > 0;
        boolean emailExists = userRepository.findByEmailIgnoreCase(DEFAULT_EMAIL).isPresent();

        if (roleExists || emailExists) {
            return;
        }

        User admin = new User();
        admin.setFullName(DEFAULT_NAME);
        admin.setEmail(DEFAULT_EMAIL);
        admin.setOfficialEmail(DEFAULT_EMAIL);
        admin.setPassword(passwordEncoder.encode(DEFAULT_PASSWORD));
        admin.setRole(User.Role.GLOBAL_ADMIN);
        admin.setStatus(User.Status.ACTIVE);
        admin.setIsAdmin(true);
        admin.setIsActive(true);
        admin.setApproved(true);
        admin.setTenantCode(DEFAULT_TENANT_CODE);

        userRepository.save(admin);
    }
}
 