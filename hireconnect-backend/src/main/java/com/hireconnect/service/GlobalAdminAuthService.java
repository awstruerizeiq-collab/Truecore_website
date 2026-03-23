package com.hireconnect.service;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.hireconnect.dto.request.GlobalAdminLoginRequest;
import com.hireconnect.dto.request.GlobalAdminRegisterRequest;
import com.hireconnect.dto.request.GlobalAdminUpdateRequest;
import com.hireconnect.dto.response.GlobalAdminAuthResponse;
import com.hireconnect.entity.GlobalAdmin;
import com.hireconnect.repository.GlobalAdminRepository;
import com.hireconnect.util.JwtUtil;

import jakarta.persistence.EntityNotFoundException;

@Service
public class GlobalAdminAuthService {

    private final GlobalAdminRepository globalAdminRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public GlobalAdminAuthService(GlobalAdminRepository globalAdminRepository,
                                  PasswordEncoder passwordEncoder,
                                  JwtUtil jwtUtil) {
        this.globalAdminRepository = globalAdminRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public GlobalAdminAuthResponse register(GlobalAdminRegisterRequest req) {
        String email = req.getEmail().toLowerCase().trim();

        if (globalAdminRepository.existsByEmail(email)) {
            throw new RuntimeException("Global admin already exists");
        }

        GlobalAdmin admin = new GlobalAdmin();
        admin.setFullName(req.getFullName().trim());
        admin.setEmail(email);
        admin.setPassword(passwordEncoder.encode(req.getPassword()));
        admin.setRole("GLOBAL_ADMIN");

        admin = globalAdminRepository.save(admin);

        UserDetails userDetails = buildUserDetails(admin);
        String token = jwtUtil.generateToken(userDetails);

        return new GlobalAdminAuthResponse(
                admin.getId(),
                admin.getFullName(),
                admin.getEmail(),
                admin.getRole(),
                token
        );
    }

    public GlobalAdminAuthResponse login(GlobalAdminLoginRequest req) {
        String email = req.getEmail().toLowerCase().trim();

        GlobalAdmin admin = globalAdminRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!passwordEncoder.matches(req.getPassword(), admin.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        UserDetails userDetails = buildUserDetails(admin);
        String token = jwtUtil.generateToken(userDetails);

        return new GlobalAdminAuthResponse(
                admin.getId(),
                admin.getFullName(),
                admin.getEmail(),
                admin.getRole(),
                token
        );
    }

    private UserDetails buildUserDetails(GlobalAdmin admin) {
        return new User(
                admin.getEmail(),
                admin.getPassword(),
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + admin.getRole()))
        );
    }

    public List<GlobalAdminAuthResponse> getAllGlobalAdmins() {
        return globalAdminRepository.findAll()
                .stream()
                .map(a -> new GlobalAdminAuthResponse(
                        a.getId(),
                        a.getFullName(),
                        a.getEmail(),
                        a.getRole(),
                        null
                ))
                .collect(Collectors.toList());
    }

    public GlobalAdminAuthResponse getById(Long id) {
        GlobalAdmin a = globalAdminRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Global admin not found"));

        return new GlobalAdminAuthResponse(
                a.getId(),
                a.getFullName(),
                a.getEmail(),
                a.getRole(),
                null
        );
    }

    public GlobalAdminAuthResponse update(Long id, GlobalAdminUpdateRequest req) {
        GlobalAdmin a = globalAdminRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Global admin not found"));

        if (req.getFullName() != null && !req.getFullName().trim().isEmpty()) {
            a.setFullName(req.getFullName().trim());
        }

        if (req.getEmail() != null && !req.getEmail().trim().isEmpty()) {
            String newEmail = req.getEmail().trim().toLowerCase();

            globalAdminRepository.findByEmail(newEmail).ifPresent(existing -> {
                if (!existing.getId().equals(id)) {
                    throw new RuntimeException("Email already exists");
                }
            });

            a.setEmail(newEmail);
        }

        if (req.getPassword() != null && !req.getPassword().trim().isEmpty()) {
            a.setPassword(passwordEncoder.encode(req.getPassword().trim()));
        }

        GlobalAdmin saved = globalAdminRepository.save(a);
        return new GlobalAdminAuthResponse(
                saved.getId(),
                saved.getFullName(),
                saved.getEmail(),
                saved.getRole(),
                null
        );
    }

    public void delete(Long id) {
        GlobalAdmin a = globalAdminRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Global admin not found"));
        globalAdminRepository.delete(a);
    }
}
