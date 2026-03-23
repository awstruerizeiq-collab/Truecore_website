package com.hireconnect.service;

import java.io.IOException;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.hireconnect.entity.AdminPolicy;
import com.hireconnect.repository.AdminPolicyRepository;
import com.hireconnect.util.FileStorageUtil;

@Service
public class AdminPolicyService {

    private final AdminPolicyRepository repo;

    @Value("${file.upload.dir:uploads/policies}")
    private String legacyUploadDir;

    public AdminPolicyService(AdminPolicyRepository repo) {
        this.repo = repo;
    }

    public AdminPolicy save(AdminPolicy policy, MultipartFile file) throws IOException {
        if (file != null && !file.isEmpty()) {
            policy.setAttachmentName(FileStorageUtil.sanitizeFilename(file.getOriginalFilename(), "policy"));
            policy.setAttachmentContentType(file.getContentType());
            policy.setAttachmentData(file.getBytes());
            policy.setAttachmentPath("");
        }

        AdminPolicy saved = repo.save(policy);
        if (file != null && !file.isEmpty()) {
            saved.setAttachmentPath(saved.getTenantCode() + "/" + saved.getId());
            saved = repo.save(saved);
        }
        return saved;
    }

    public List<AdminPolicy> getAllByTenant(String tenantCode) {
        return repo.findByTenantCode(tenantCode);
    }

    public List<AdminPolicy> getAll() {
        return repo.findAll();
    }

    public ResponseEntity<Resource> viewFile(String tenantCode, String token) {
        AdminPolicy policy = getByTenantAndToken(tenantCode, token);
        return FileStorageUtil.buildResponse(
                policy.getAttachmentData(),
                buildLegacyPath(policy),
                policy.getAttachmentContentType(),
                policy.getAttachmentName(),
                false
        );
    }

    public ResponseEntity<Resource> downloadFile(String tenantCode, String token) {
        AdminPolicy policy = getByTenantAndToken(tenantCode, token);
        return FileStorageUtil.buildResponse(
                policy.getAttachmentData(),
                buildLegacyPath(policy),
                policy.getAttachmentContentType(),
                policy.getAttachmentName(),
                true
        );
    }

    private AdminPolicy getByTenantAndToken(String tenantCode, String token) {
        return repo.findByTenantCodeAndAttachmentPath(tenantCode, tenantCode + "/" + token)
                .orElseThrow(() -> new RuntimeException("Policy attachment not found"));
    }

    private String buildLegacyPath(AdminPolicy policy) {
        if (policy.getAttachmentPath() == null || policy.getAttachmentPath().isBlank()) {
            return null;
        }
        return legacyUploadDir + "/" + policy.getAttachmentPath();
    }
}
