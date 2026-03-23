package com.hireconnect.service;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import com.hireconnect.entity.HolidayAttachment;
import com.hireconnect.repository.HolidayAttachmentRepository;
import com.hireconnect.util.FileStorageUtil;

@Service
public class HolidayAttachmentService {

    private static final Set<String> ALLOWED_EXT = Set.of("doc", "docx");

    private final HolidayAttachmentRepository attachmentRepository;

    public HolidayAttachmentService(HolidayAttachmentRepository attachmentRepository) {
        this.attachmentRepository = attachmentRepository;
    }

    public List<HolidayAttachment> list(String tenantCode, Long companyId) {
        validateContext(tenantCode, companyId);
        return attachmentRepository.findByTenantCodeAndCompanyIdOrderByUploadedAtDesc(tenantCode, companyId)
                .stream()
                .peek(this::refreshDownloadPath)
                .toList();
    }

    public HolidayAttachment upload(String tenantCode, Long companyId, MultipartFile file, String uploadedBy) throws IOException {
        validateContext(tenantCode, companyId);
        validateFile(file);

        String originalName = FileStorageUtil.sanitizeFilename(file.getOriginalFilename(), "upload");
        String ext = getExtension(originalName).toLowerCase();

        HolidayAttachment attachment = new HolidayAttachment();
        attachment.setTenantCode(tenantCode);
        attachment.setCompanyId(companyId);
        attachment.setFileName(originalName);
        attachment.setFileType(ext);
        attachment.setContentType(file.getContentType());
        attachment.setFilePath("");
        attachment.setFileData(file.getBytes());
        attachment.setUploadedBy(uploadedBy != null ? uploadedBy : "System");
        attachment.setUploadedAt(LocalDateTime.now());

        HolidayAttachment saved = attachmentRepository.save(attachment);
        saved.setFilePath(buildViewPath(saved));
        return attachmentRepository.save(saved);
    }

    public void delete(Long id, String tenantCode, Long companyId) {
        validateContext(tenantCode, companyId);
        attachmentRepository.delete(getAttachment(id, tenantCode, companyId));
    }

    public ResponseEntity<Resource> view(Long id, String tenantCode, Long companyId) {
        HolidayAttachment attachment = getAttachment(id, tenantCode, companyId);
        return FileStorageUtil.buildResponse(
                attachment.getFileData(),
                attachment.getFilePath(),
                resolveContentType(attachment),
                attachment.getFileName(),
                false
        );
    }

    public ResponseEntity<Resource> download(Long id, String tenantCode, Long companyId) {
        HolidayAttachment attachment = getAttachment(id, tenantCode, companyId);
        return FileStorageUtil.buildResponse(
                attachment.getFileData(),
                attachment.getFilePath(),
                resolveContentType(attachment),
                attachment.getFileName(),
                true
        );
    }

    public HolidayAttachment getAttachment(Long id, String tenantCode, Long companyId) {
        validateContext(tenantCode, companyId);
        HolidayAttachment attachment = attachmentRepository
                .findByIdAndTenantCodeAndCompanyId(id, tenantCode, companyId)
                .orElseThrow(() -> new RuntimeException("Attachment not found"));
        refreshDownloadPath(attachment);
        return attachment;
    }

    private void refreshDownloadPath(HolidayAttachment attachment) {
        if (attachment.getId() != null && FileStorageUtil.hasData(attachment.getFileData())) {
            attachment.setFilePath(buildViewPath(attachment));
        }
    }

    private String buildViewPath(HolidayAttachment attachment) {
        return "/api/admin/attendance/holidays/uploads/" + attachment.getId()
                + "/view?tenantCode=" + attachment.getTenantCode()
                + "&companyId=" + attachment.getCompanyId();
    }

    private String resolveContentType(HolidayAttachment attachment) {
        if (StringUtils.hasText(attachment.getContentType())) {
            return attachment.getContentType();
        }
        return switch ((attachment.getFileType() == null ? "" : attachment.getFileType()).toLowerCase()) {
            case "doc" -> "application/msword";
            case "docx" -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            default -> "application/octet-stream";
        };
    }

    private void validateContext(String tenantCode, Long companyId) {
        if (tenantCode == null || tenantCode.isBlank()) {
            throw new RuntimeException("tenantCode is required");
        }
        if (companyId == null) {
            throw new RuntimeException("companyId is required");
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("File is required");
        }
        String ext = getExtension(file.getOriginalFilename());
        if (!ALLOWED_EXT.contains(ext.toLowerCase())) {
            throw new RuntimeException("Only Word files (.doc, .docx) are allowed");
        }
    }

    private String getExtension(String filename) {
        if (filename == null) return "";
        String name = filename.trim();
        int idx = name.lastIndexOf('.');
        if (idx == -1) return "";
        return name.substring(idx + 1);
    }
}
