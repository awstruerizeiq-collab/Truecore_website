package com.hireconnect.service;

import java.util.Collection;
import java.util.Locale;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.hireconnect.entity.User;
import com.hireconnect.repository.GlobalAdminRepository;
import com.hireconnect.repository.UserRepository;
import com.hireconnect.util.JwtUtil;

@Service
public class GlobalAdminAccessService {

    private final JwtUtil jwtUtil;
    private final GlobalAdminRepository globalAdminRepository;
    private final UserRepository userRepository;

    public GlobalAdminAccessService(
            JwtUtil jwtUtil,
            GlobalAdminRepository globalAdminRepository,
            UserRepository userRepository
    ) {
        this.jwtUtil = jwtUtil;
        this.globalAdminRepository = globalAdminRepository;
        this.userRepository = userRepository;
    }

    public String validate(String authHeader, String failureMessage) {
        if (authHeader == null || authHeader.isBlank()) {
            throw new RuntimeException("Authorization header is required");
        }

        String token = authHeader.replaceFirst("(?i)^Bearer\\s+", "").trim();
        if (token.isEmpty()) {
            throw new RuntimeException("Invalid authorization token");
        }

        String subject;
        try {
            subject = jwtUtil.extractUsername(token);
        } catch (Exception ex) {
            throw new RuntimeException("Invalid or expired token");
        }

        if (subject == null || subject.isBlank()) {
            throw new RuntimeException("Invalid token subject");
        }

        String normalizedEmail = subject.trim().toLowerCase(Locale.ROOT);

        if (isPrivilegedEmail(normalizedEmail)
                || hasPrivilegedRoleClaim(token)
                || hasPrivilegedAuthentication(normalizedEmail)) {
            return normalizedEmail;
        }

        throw new RuntimeException(failureMessage);
    }

    private boolean isPrivilegedEmail(String email) {
        if (globalAdminRepository.existsByEmailIgnoreCase(email)) {
            return true;
        }

        return userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull(email)
                .map(user -> user.getRole() == User.Role.GLOBAL_ADMIN
                        || user.getRole() == User.Role.ADMIN
                        || Boolean.TRUE.equals(user.getIsAdmin()))
                .orElse(false);
    }

    private boolean hasPrivilegedRoleClaim(String token) {
        try {
            String role = jwtUtil.extractClaim(token, claims -> {
                Object raw = claims.get("role");
                return raw == null ? "" : String.valueOf(raw);
            });
            return isPrivilegedRole(role);
        } catch (Exception ignored) {
            return false;
        }
    }

    private boolean hasPrivilegedAuthentication(String normalizedEmail) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof org.springframework.security.core.userdetails.UserDetails userDetails) {
            String username = userDetails.getUsername();
            if (username != null && username.trim().equalsIgnoreCase(normalizedEmail) && isPrivilegedAuthorities(userDetails.getAuthorities())) {
                return true;
            }
        }

        String authName = authentication.getName();
        return authName != null
                && authName.trim().equalsIgnoreCase(normalizedEmail)
                && isPrivilegedAuthorities(authentication.getAuthorities());
    }

    private boolean isPrivilegedAuthorities(Collection<? extends GrantedAuthority> authorities) {
        if (authorities == null || authorities.isEmpty()) {
            return false;
        }

        return authorities.stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(this::isPrivilegedRole);
    }

    private boolean isPrivilegedRole(String roleValue) {
        String normalized = String.valueOf(roleValue == null ? "" : roleValue)
                .trim()
                .toUpperCase(Locale.ROOT)
                .replace(' ', '_');

        return "GLOBAL_ADMIN".equals(normalized)
                || "ROLE_GLOBAL_ADMIN".equals(normalized)
                || "ADMIN".equals(normalized)
                || "ROLE_ADMIN".equals(normalized)
                || "SUPER_ADMIN".equals(normalized)
                || "ROLE_SUPER_ADMIN".equals(normalized)
                || "COMPANY_ADMIN".equals(normalized)
                || "ROLE_COMPANY_ADMIN".equals(normalized);
    }
}
