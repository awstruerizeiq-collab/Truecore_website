package com.hireconnect.service;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hireconnect.dto.request.PayslipGeneratorConfigRequest;
import com.hireconnect.dto.response.PayslipGeneratorConfigResponse;
import com.hireconnect.entity.PayslipGeneratorConfig;
import com.hireconnect.entity.User;
import com.hireconnect.repository.PayslipGeneratorConfigRepository;
import com.hireconnect.repository.UserRepository;
import com.hireconnect.util.JwtUtil;

@Service
public class PayslipGeneratorConfigService {

    private final PayslipGeneratorConfigRepository configRepository;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final ObjectMapper objectMapper;

    public PayslipGeneratorConfigService(
        PayslipGeneratorConfigRepository configRepository,
        UserRepository userRepository,
        JwtUtil jwtUtil,
        ObjectMapper objectMapper
    ) {
        this.configRepository = configRepository;
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
        this.objectMapper = objectMapper;
    }

    public PayslipGeneratorConfigResponse saveOrUpdate(String authorizationHeader, PayslipGeneratorConfigRequest request) {
        if (request == null || request.getCompanyId() == null) {
            throw new RuntimeException("companyId is required");
        }
        if (request.getComponents() == null || request.getComponents().isEmpty()) {
            throw new RuntimeException("At least one component is required");
        }

        AuthContext auth = buildAuthContext(authorizationHeader);
        if (!auth.isSuperAdminLike()) {
            throw new RuntimeException("Only Super Admin can create or update payslip generator config.");
        }

        PayslipGeneratorConfig entity = configRepository
            .findByCompanyId(request.getCompanyId())
            .orElse(new PayslipGeneratorConfig());

        entity.setCompanyId(request.getCompanyId());
        entity.setTenantCode(clean(request.getTenantCode()));
        entity.setTemplateVariant(normalizeTemplateVariant(request.getTemplateVariant()));

        try {
            entity.setComponentsJson(objectMapper.writeValueAsString(request.getComponents()));
        } catch (Exception e) {
            throw new RuntimeException("Invalid components payload");
        }

        PayslipGeneratorConfig saved = configRepository.save(entity);
        return toResponse(saved);
    }

    public PayslipGeneratorConfigResponse getByCompanyId(String authorizationHeader, Long companyId) {
        if (companyId == null) {
            throw new RuntimeException("companyId is required");
        }

        AuthContext auth = buildAuthContext(authorizationHeader);
        enforceReadAccess(auth, companyId);

        PayslipGeneratorConfig config = configRepository
            .findByCompanyId(companyId)
            .orElseThrow(() -> new RuntimeException("Payslip Generator not configured for this company."));

        return toResponse(config);
    }

    private void enforceReadAccess(AuthContext auth, Long requestedCompanyId) {
        if (auth.isSuperAdminLike()) return;

        if (auth.companyId == null) {
            throw new RuntimeException("Forbidden: company context missing for user.");
        }
        if (!requestedCompanyId.equals(auth.companyId)) {
            throw new RuntimeException("Forbidden: you can only read config for your own company.");
        }
    }

    private AuthContext buildAuthContext(String authorizationHeader) {
        String token = extractToken(authorizationHeader);
        if (token.isBlank()) {
            throw new RuntimeException("Unauthorized");
        }

        String subjectEmail;
        try {
            subjectEmail = jwtUtil.extractUsername(token);
        } catch (Exception e) {
            throw new RuntimeException("Unauthorized");
        }

        String claimRole = safeStringClaim(token, "role");
        Long claimCompanyId = safeLongClaim(token, "companyId");

        Optional<User> userOpt = subjectEmail == null ? Optional.empty() : userRepository.findByEmail(subjectEmail);
        String dbRole = userOpt.map(u -> u.getRole() == null ? "" : u.getRole().name()).orElse("");
        Long dbCompanyId = userOpt.map(User::getCompanyId).orElse(null);

        String effectiveRole = !claimRole.isBlank() ? claimRole : dbRole;
        Long effectiveCompanyId = claimCompanyId != null ? claimCompanyId : dbCompanyId;

        return new AuthContext(effectiveRole, effectiveCompanyId);
    }

    private String safeStringClaim(String token, String claimKey) {
        try {
            Object value = jwtUtil.extractClaim(token, claims -> claims.get(claimKey));
            return value == null ? "" : String.valueOf(value).trim();
        } catch (Exception e) {
            return "";
        }
    }

    private Long safeLongClaim(String token, String claimKey) {
        try {
            Object value = jwtUtil.extractClaim(token, claims -> claims.get(claimKey));
            if (value == null) return null;
            if (value instanceof Number n) return n.longValue();
            String raw = String.valueOf(value).trim();
            if (raw.isEmpty()) return null;
            return Long.parseLong(raw);
        } catch (Exception e) {
            return null;
        }
    }

    private String extractToken(String authorizationHeader) {
        if (authorizationHeader == null) return "";
        String header = authorizationHeader.trim();
        if (header.isEmpty()) return "";
        if (header.startsWith("Bearer ")) {
            return header.substring(7).trim();
        }
        return header;
    }

    private String clean(String value) {
        if (value == null) return null;
        String v = value.trim();
        return v.isEmpty() ? null : v;
    }

    private PayslipGeneratorConfigResponse toResponse(PayslipGeneratorConfig entity) {
        PayslipGeneratorConfigResponse response = new PayslipGeneratorConfigResponse();
        response.setId(entity.getId());
        response.setCompanyId(entity.getCompanyId());
        response.setTenantCode(entity.getTenantCode());
        response.setTemplateVariant(normalizeTemplateVariant(entity.getTemplateVariant()));
        response.setCreatedAt(entity.getCreatedAt());
        response.setUpdatedAt(entity.getUpdatedAt());

        try {
            List<Map<String, Object>> rawItems = objectMapper.readValue(
                entity.getComponentsJson(),
                new TypeReference<List<Map<String, Object>>>() {}
            );

            List<PayslipGeneratorConfigResponse.ComponentItem> items = rawItems.stream().map(raw -> {
                PayslipGeneratorConfigResponse.ComponentItem item = new PayslipGeneratorConfigResponse.ComponentItem();
                item.setComponent(raw.get("component") == null ? "" : String.valueOf(raw.get("component")));
                item.setMode(raw.get("mode") == null ? "amount" : String.valueOf(raw.get("mode")));
                item.setFieldKey(raw.get("fieldKey") == null ? null : String.valueOf(raw.get("fieldKey")));
                item.setCategory(raw.get("category") == null ? null : String.valueOf(raw.get("category")));
                Object linkedComponents = raw.get("linkedComponents");
                if (linkedComponents instanceof List<?> list) {
                    item.setLinkedComponents(
                        list.stream().filter(v -> v != null && !String.valueOf(v).isBlank())
                            .map(String::valueOf)
                            .toList()
                    );
                } else {
                    item.setLinkedComponents(List.of());
                }

                Object linkedPercentages = raw.get("linkedPercentages");
                if (linkedPercentages instanceof Map<?, ?> map) {
                    java.util.Map<String, java.math.BigDecimal> parsedPercentages = new java.util.HashMap<>();
                    map.forEach((k, v) -> {
                        if (k == null || v == null) return;
                        try {
                            parsedPercentages.put(String.valueOf(k), new java.math.BigDecimal(String.valueOf(v)));
                        } catch (Exception ignored) {
                            // ignore malformed percentage values
                        }
                    });
                    item.setLinkedPercentages(parsedPercentages);
                } else {
                    item.setLinkedPercentages(java.util.Map.of());
                }

                Object value = raw.get("value");
                if (value != null) {
                    try {
                        item.setValue(new java.math.BigDecimal(String.valueOf(value)));
                    } catch (Exception ignored) {
                        item.setValue(null);
                    }
                }

                return item;
            }).toList();

            response.setComponents(items);
        } catch (Exception e) {
            response.setComponents(List.of());
        }

        return response;
    }

    private static class AuthContext {
        private final String role;
        private final Long companyId;

        private AuthContext(String role, Long companyId) {
            this.role = role == null ? "" : role.trim().toUpperCase();
            this.companyId = companyId;
        }

        private boolean isSuperAdminLike() {
            return "COMPANY_ADMIN".equals(role)
                || "GLOBAL_ADMIN".equals(role)
                || "SUPER_ADMIN".equals(role);
        }
    }

    private String normalizeTemplateVariant(String templateVariant) {
        String raw = clean(templateVariant);
        if (raw == null) return "template_1";
        String normalized = raw.toLowerCase();
        if ("template_1".equals(normalized)
            || "template_2".equals(normalized)
            || "template_3".equals(normalized)) {
            return normalized;
        }
        return "template_1";
    }
}