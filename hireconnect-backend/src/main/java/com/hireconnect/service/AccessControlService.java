package com.hireconnect.service;

import com.hireconnect.dto.request.AccessControlModuleConfigRequest;
import com.hireconnect.dto.request.FingerprintVerificationRequest;
import com.hireconnect.dto.response.AccessControlDashboardResponse;
import com.hireconnect.dto.response.AccessControlModuleConfigResponse;
import com.hireconnect.dto.response.BiometricVerificationLogResponse;
import com.hireconnect.dto.response.FingerprintVerificationResponse;
import com.hireconnect.entity.AccessControlModuleConfig;
import com.hireconnect.entity.BiometricVerificationLog;
import com.hireconnect.entity.User;
import com.hireconnect.repository.AccessControlModuleConfigRepository;
import com.hireconnect.repository.BiometricVerificationLogRepository;
import com.hireconnect.repository.CompanyRepository;
import com.hireconnect.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class AccessControlService {

    private static final String MODULE_FINGERPRINT = "fingerprint";
    private static final int ATTENDANCE_DUPLICATE_WINDOW_MINUTES = 10;

    private static final List<String> MODULE_KEYS = List.of(
        MODULE_FINGERPRINT,
        "face-recognition",
        "iris-scan",
        "id-card-access",
        "mobile-app-access"
    );

    private final AccessControlModuleConfigRepository moduleConfigRepository;
    private final BiometricVerificationLogRepository verificationLogRepository;
    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final AttendanceService attendanceService;

    public AccessControlService(
        AccessControlModuleConfigRepository moduleConfigRepository,
        BiometricVerificationLogRepository verificationLogRepository,
        CompanyRepository companyRepository,
        UserRepository userRepository,
        AttendanceService attendanceService
    ) {
        this.moduleConfigRepository = moduleConfigRepository;
        this.verificationLogRepository = verificationLogRepository;
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
        this.attendanceService = attendanceService;
    }

    @Transactional
    public AccessControlModuleConfigResponse saveModuleConfiguration(
        String moduleKeyFromPath,
        AccessControlModuleConfigRequest request
    ) {
        if (request == null) {
            throw new RuntimeException("Request body is required.");
        }
        String moduleKey = normalizeAndValidateModuleKey(moduleKeyFromPath);
        Long companyId = validateCompanyId(request.getCompanyId());

        if (request.getModuleKey() != null && !request.getModuleKey().isBlank()) {
            String moduleKeyFromBody = normalizeAndValidateModuleKey(request.getModuleKey());
            if (!moduleKey.equals(moduleKeyFromBody)) {
                throw new RuntimeException("Module key in URL and request body must match.");
            }
        }

        String apiKey = normalizeNullable(request.getApiKey());
        if (apiKey != null) {
            Optional<AccessControlModuleConfig> existingWithApiKey =
                moduleConfigRepository.findByApiKeyAndModuleKey(apiKey, moduleKey);
            if (existingWithApiKey.isPresent() && !companyId.equals(existingWithApiKey.get().getCompanyId())) {
                throw new RuntimeException("API key is already assigned to another company for this module.");
            }
        }

        AccessControlModuleConfig config = moduleConfigRepository
            .findByCompanyIdAndModuleKey(companyId, moduleKey)
            .orElseGet(AccessControlModuleConfig::new);

        config.setCompanyId(companyId);
        config.setModuleKey(moduleKey);
        config.setEnabled(Boolean.TRUE.equals(request.getEnabled()));
        config.setDeviceName(normalizeNullable(request.getDeviceName()));
        config.setLocation(normalizeNullable(request.getLocation()));
        config.setApiKey(apiKey);

        return toModuleConfigResponse(moduleConfigRepository.save(config));
    }

    @Transactional(readOnly = true)
    public List<AccessControlModuleConfigResponse> getModuleConfigurations(Long companyId) {
        Long validatedCompanyId = validateCompanyId(companyId);

        Map<String, AccessControlModuleConfig> existingByModule = moduleConfigRepository
            .findByCompanyIdOrderByModuleKeyAsc(validatedCompanyId)
            .stream()
            .filter(item -> {
                String key = normalizeNullable(item.getModuleKey());
                return key != null && MODULE_KEYS.contains(key.toLowerCase(Locale.ROOT));
            })
            .collect(Collectors.toMap(
                item -> normalizeNullable(item.getModuleKey()).toLowerCase(Locale.ROOT),
                item -> item,
                (a, b) -> a
            ));

        List<AccessControlModuleConfigResponse> response = new ArrayList<>();
        for (String moduleKey : MODULE_KEYS) {
            AccessControlModuleConfig config = existingByModule.get(moduleKey);
            if (config != null) {
                response.add(toModuleConfigResponse(config));
            } else {
                AccessControlModuleConfigResponse empty = new AccessControlModuleConfigResponse();
                empty.setCompanyId(validatedCompanyId);
                empty.setModuleKey(moduleKey);
                empty.setEnabled(Boolean.FALSE);
                empty.setDeviceName(defaultDeviceName(moduleKey));
                response.add(empty);
            }
        }

        return response;
    }

    @Transactional(readOnly = true)
    public AccessControlDashboardResponse getDashboardSummary(Long companyId) {
        Long validatedCompanyId = validateCompanyId(companyId);

        AccessControlDashboardResponse response = new AccessControlDashboardResponse();
        response.setTotalModules(MODULE_KEYS.size());
        response.setActivePolicies(moduleConfigRepository.countByCompanyIdAndEnabledTrue(validatedCompanyId));
        response.setDevicesConnected(moduleConfigRepository.countDevicesConnected(validatedCompanyId));
        response.setLastAudit(
            verificationLogRepository.findTopByCompanyIdOrderByCreatedAtDesc(validatedCompanyId)
                .map(BiometricVerificationLog::getCreatedAt)
                .orElse(null)
        );

        Map<String, Long> stats = new LinkedHashMap<>();
        stats.put("totalVerifications", verificationLogRepository.countByCompanyId(validatedCompanyId));
        stats.put("successfulVerifications", verificationLogRepository.countByCompanyIdAndVerifiedTrue(validatedCompanyId));
        stats.put("failedVerifications", verificationLogRepository.countByCompanyIdAndVerifiedFalse(validatedCompanyId));
        stats.put("attendanceActivated", verificationLogRepository.countByCompanyIdAndAttendanceActivatedTrue(validatedCompanyId));
        response.setBiometricStats(stats);

        return response;
    }

    @Transactional(readOnly = true)
    public List<BiometricVerificationLogResponse> getRecentActivity(Long companyId) {
        Long validatedCompanyId = validateCompanyId(companyId);
        return verificationLogRepository.findTop20ByCompanyIdOrderByCreatedAtDesc(validatedCompanyId)
            .stream()
            .map(this::toVerificationLogResponse)
            .toList();
    }

    @Transactional
    public VerifyFingerprintResult verifyFingerprint(String rawApiKey, FingerprintVerificationRequest request) {
        if (request == null) {
            throw new RuntimeException("Request body is required.");
        }
        String apiKey = normalizeNullable(rawApiKey);
        if (apiKey == null) {
            throw new AccessDeviceAuthException("Missing X-API-KEY header.");
        }

        AccessControlModuleConfig config = moduleConfigRepository
            .findByApiKeyAndModuleKey(apiKey, MODULE_FINGERPRINT)
            .orElseThrow(() -> new AccessDeviceAuthException("Invalid API key for fingerprint module."));

        Long companyId = config.getCompanyId();
        String employeeCode = normalizeNullable(request.getEmployeeId());
        String requestModuleKey = normalizeNullable(request.getModuleKey());
        String requestDeviceName = normalizeNullable(request.getDeviceName());
        String requestLocation = normalizeNullable(request.getLocation());
        boolean verified = Boolean.TRUE.equals(request.getVerified());
        boolean attendanceActivated = false;

        String message;
        if (requestModuleKey != null && !MODULE_FINGERPRINT.equals(requestModuleKey.toLowerCase(Locale.ROOT))) {
            message = "Invalid moduleKey. This endpoint only supports fingerprint verification.";
        } else if (!Boolean.TRUE.equals(config.getEnabled())) {
            message = "Fingerprint module is disabled for this company.";
        } else if (!verified) {
            message = "Fingerprint verification failed on device side.";
        } else if (employeeCode == null) {
            message = "Employee ID is required.";
        } else {
            Optional<User> userOptional = userRepository
                .findByEmployeeIdAndCompanyIdAndDeletedAtIsNull(employeeCode, companyId);

            if (userOptional.isEmpty()) {
                message = "Employee not found in this company.";
            } else {
                AttendanceService.BiometricActivationResult attendanceResult =
                    attendanceService.activateBiometricAttendance(
                        userOptional.get().getId(),
                        "biometric/fingerprint",
                        ATTENDANCE_DUPLICATE_WINDOW_MINUTES
                    );
                attendanceActivated = attendanceResult.isAttendanceActivated();
                message = attendanceResult.getMessage();
                if (!attendanceActivated && attendanceResult.isDuplicate()) {
                    message = "Fingerprint verified. " + message;
                }
            }
        }

        BiometricVerificationLog log = new BiometricVerificationLog();
        log.setCompanyId(companyId);
        log.setEmployeeId(employeeCode);
        log.setModuleKey(MODULE_FINGERPRINT);
        log.setDeviceName(requestDeviceName != null ? requestDeviceName : config.getDeviceName());
        log.setLocation(requestLocation != null ? requestLocation : config.getLocation());
        log.setVerified(verified);
        log.setAttendanceActivated(attendanceActivated);
        log.setMessage(message);
        verificationLogRepository.save(log);

        FingerprintVerificationResponse response = new FingerprintVerificationResponse();
        response.setVerified(verified);
        response.setAttendanceActivated(attendanceActivated);
        response.setEmployeeId(employeeCode);
        response.setModuleKey(MODULE_FINGERPRINT);
        response.setDeviceName(log.getDeviceName());
        response.setLocation(log.getLocation());
        response.setCompanyId(companyId);

        boolean success = verified && (attendanceActivated || message.toLowerCase(Locale.ROOT).contains("already"));
        String clientMessage = success
            ? (attendanceActivated
                ? "Fingerprint verified and attendance activated"
                : "Fingerprint verified. Attendance was already marked.")
            : message;

        return new VerifyFingerprintResult(success, clientMessage, response);
    }

    private AccessControlModuleConfigResponse toModuleConfigResponse(AccessControlModuleConfig config) {
        AccessControlModuleConfigResponse response = new AccessControlModuleConfigResponse();
        response.setId(config.getId());
        response.setCompanyId(config.getCompanyId());
        response.setModuleKey(config.getModuleKey());
        response.setEnabled(Boolean.TRUE.equals(config.getEnabled()));
        response.setDeviceName(config.getDeviceName());
        response.setLocation(config.getLocation());
        response.setApiKey(config.getApiKey());
        response.setMaskedApiKey(maskApiKey(config.getApiKey()));
        response.setCreatedAt(config.getCreatedAt());
        response.setUpdatedAt(config.getUpdatedAt());
        return response;
    }

    private BiometricVerificationLogResponse toVerificationLogResponse(BiometricVerificationLog log) {
        BiometricVerificationLogResponse response = new BiometricVerificationLogResponse();
        response.setId(log.getId());
        response.setCompanyId(log.getCompanyId());
        response.setEmployeeId(log.getEmployeeId());
        response.setModuleKey(log.getModuleKey());
        response.setDeviceName(log.getDeviceName());
        response.setLocation(log.getLocation());
        response.setVerified(Boolean.TRUE.equals(log.getVerified()));
        response.setAttendanceActivated(Boolean.TRUE.equals(log.getAttendanceActivated()));
        response.setMessage(log.getMessage());
        response.setCreatedAt(log.getCreatedAt());
        return response;
    }

    private Long validateCompanyId(Long companyId) {
        if (companyId == null) {
            throw new RuntimeException("companyId is required.");
        }
        if (!companyRepository.existsById(companyId)) {
            throw new RuntimeException("Company not found for companyId: " + companyId);
        }
        return companyId;
    }

    private String normalizeAndValidateModuleKey(String moduleKey) {
        String normalized = normalizeNullable(moduleKey);
        if (normalized != null) {
            normalized = normalized.toLowerCase(Locale.ROOT);
        }
        if (normalized == null) {
            throw new RuntimeException("moduleKey is required.");
        }
        if (!MODULE_KEYS.contains(normalized)) {
            throw new RuntimeException("Unsupported moduleKey: " + moduleKey);
        }
        return normalized;
    }

    private String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String maskApiKey(String apiKey) {
        if (apiKey == null || apiKey.isBlank()) {
            return null;
        }
        if (apiKey.length() <= 6) {
            return "******";
        }
        String prefix = apiKey.substring(0, 3);
        String suffix = apiKey.substring(apiKey.length() - 3);
        return prefix + "******" + suffix;
    }

    private String defaultDeviceName(String moduleKey) {
        if (MODULE_FINGERPRINT.equals(moduleKey)) return "Fingerprint Device";
        if ("face-recognition".equals(moduleKey)) return "Face Recognition Device";
        if ("iris-scan".equals(moduleKey)) return "Iris Scan Device";
        if ("id-card-access".equals(moduleKey)) return "ID Card Access Device";
        if ("mobile-app-access".equals(moduleKey)) return "Mobile App Access";
        return "Access Device";
    }

    public static class VerifyFingerprintResult {
        private final boolean success;
        private final String message;
        private final FingerprintVerificationResponse data;

        public VerifyFingerprintResult(boolean success, String message, FingerprintVerificationResponse data) {
            this.success = success;
            this.message = message;
            this.data = data;
        }

        public boolean isSuccess() {
            return success;
        }

        public String getMessage() {
            return message;
        }

        public FingerprintVerificationResponse getData() {
            return data;
        }
    }

    public static class AccessDeviceAuthException extends RuntimeException {
        public AccessDeviceAuthException(String message) {
            super(message);
        }
    }
}
