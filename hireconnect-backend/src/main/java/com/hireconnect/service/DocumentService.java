package com.hireconnect.service;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.hireconnect.entity.Document;
import com.hireconnect.entity.User;
import com.hireconnect.repository.DocumentRepository;
import com.hireconnect.repository.UserRepository;
import com.hireconnect.util.FileStorageUtil;

@Service
public class DocumentService {

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserService userService;

    private static final Map<String, Document.DocumentType> DOCUMENT_TYPE_MAPPING = Map.ofEntries(
            Map.entry("tenthMarksheet", Document.DocumentType.TENTH_MARKSHEET),
            Map.entry("twelfthMarksheet", Document.DocumentType.TWELFTH_MARKSHEET),
            Map.entry("graduationMarksheet", Document.DocumentType.GRADUATION_MARKSHEET),
            Map.entry("postGraduationMarksheet", Document.DocumentType.POST_GRADUATION_MARKSHEET),
            Map.entry("degreeCertificate", Document.DocumentType.DEGREE_CERTIFICATE),
            Map.entry("aadharCard", Document.DocumentType.AADHAR_CARD),
            Map.entry("panCard", Document.DocumentType.PAN_CARD),
            Map.entry("passportPhoto", Document.DocumentType.PASSPORT_PHOTO),
            Map.entry("offerLetter", Document.DocumentType.OFFER_LETTER),
            Map.entry("experienceLetter", Document.DocumentType.EXPERIENCE_LETTER)
    );

    public List<Document> getCurrentUserDocuments() {
        Long currentUserId = userService.getCurrentUser().getId();
        return documentRepository.findByUserIdOrderByUploadedAtDesc(currentUserId);
    }

    public List<Document> getAllDocuments() {
        return documentRepository.findAllByOrderByUploadedAtDesc();
    }

    public List<Document> getUserDocuments(Long userId) {
        userService.getUserById(userId);
        return documentRepository.findByUserIdOrderByUploadedAtDesc(userId);
    }

    public Document getDocumentById(Long documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found with id: " + documentId));

        User currentUser = userService.getCurrentUser();
        if (!document.getUserId().equals(currentUser.getId()) && !currentUser.getIsAdmin()) {
            throw new RuntimeException("Access denied: You can only access your own documents");
        }

        return document;
    }

    @Transactional
    public Document uploadDocument(MultipartFile file, String documentType) throws IOException {
        Long currentUserId = userService.getCurrentUser().getId();
        return saveDocument(currentUserId, file, documentType);
    }

    @Transactional
    public Document uploadDocumentForUser(Long userId, MultipartFile file, String documentType) throws IOException {
        userService.getUserById(userId);
        return saveDocument(userId, file, documentType);
    }

    private Document saveDocument(Long userId, MultipartFile file, String documentTypeKey) throws IOException {
        validateFile(file);

        Document.DocumentType docType = DOCUMENT_TYPE_MAPPING.get(documentTypeKey);
        if (docType == null) {
            throw new RuntimeException("Invalid document type: " + documentTypeKey);
        }

        Optional<Document> existingDoc = documentRepository.findByUserIdAndDocumentType(userId, docType);
        existingDoc.ifPresent(documentRepository::delete);

        String originalFilename = FileStorageUtil.sanitizeFilename(file.getOriginalFilename(), "document");

        Document document = new Document();
        document.setUserId(userId);
        document.setDocumentType(docType);
        document.setFileName(originalFilename);
        document.setFilePath("");
        document.setFileType(file.getContentType());
        document.setFileSize(file.getSize());
        document.setFileData(file.getBytes());
        document.setStatus(Document.DocumentStatus.SUBMITTED);

        Document saved = documentRepository.save(document);
        saved.setFilePath(buildDocumentPath(saved.getId()));
        return documentRepository.save(saved);
    }

    @Transactional
    public Document updateDocument(Long documentId, MultipartFile file) throws IOException {
        Document document = getDocumentById(documentId);
        validateFile(file);

        String originalFilename = FileStorageUtil.sanitizeFilename(file.getOriginalFilename(), "document");

        document.setFileName(originalFilename);
        document.setFilePath(buildDocumentPath(document.getId()));
        document.setFileType(file.getContentType());
        document.setFileSize(file.getSize());
        document.setFileData(file.getBytes());
        document.setStatus(Document.DocumentStatus.SUBMITTED);
        document.setUploadedAt(LocalDateTime.now());

        return documentRepository.save(document);
    }

    @Transactional
    public Document updateDocumentStatus(Long documentId, String statusStr, String remarks) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found with id: " + documentId));

        Document.DocumentStatus status;
        try {
            status = Document.DocumentStatus.valueOf(statusStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException(
                    "Invalid status: " + statusStr + ". Valid values are: SUBMITTED, PENDING, APPROVED, REJECTED");
        }

        User currentAdmin = userService.getCurrentUser();

        document.setStatus(status);
        document.setRemarks(remarks);

        if (status == Document.DocumentStatus.APPROVED || status == Document.DocumentStatus.REJECTED) {
            document.setApprovedBy(currentAdmin.getId());
            document.setApprovedAt(LocalDateTime.now());
        }

        return documentRepository.save(document);
    }

    public ResponseEntity<Resource> downloadDocument(Long documentId) {
        Document document = getDocumentById(documentId);
        return FileStorageUtil.buildResponse(
                document.getFileData(),
                document.getFilePath(),
                document.getFileType(),
                document.getFileName(),
                true
        );
    }

    @Transactional
    public void deleteDocument(Long documentId) {
        Document document = getDocumentById(documentId);
        documentRepository.delete(document);
    }

    @Transactional
    public void adminDeleteDocument(Long documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found with id: " + documentId));
        documentRepository.delete(document);
    }

    public List<Document> getDocumentsByStatus(String statusStr) {
        Document.DocumentStatus status;
        try {
            status = Document.DocumentStatus.valueOf(statusStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid status: " + statusStr);
        }

        return documentRepository.findByStatusOrderByUploadedAtDesc(status);
    }

    public List<Map<String, Object>> getAllDocumentsGroupedByEmployee(String tenantCode, Long companyId) {
        List<Document> allDocuments = documentRepository.findAllByTenantCompany(tenantCode, companyId);

        Map<Long, List<Document>> documentsByUser = allDocuments.stream()
                .collect(Collectors.groupingBy(Document::getUserId));

        List<Map<String, Object>> result = new ArrayList<>();
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("MMM dd, yyyy");

        for (Map.Entry<Long, List<Document>> entry : documentsByUser.entrySet()) {
            Long userId = entry.getKey();
            List<Document> userDocs = entry.getValue();

            try {
                User user = userService.getUserById(userId);

                if (!tenantCode.equals(user.getTenantCode()) || !companyId.equals(user.getCompanyId())) {
                    continue;
                }

                Map<String, Object> employeeData = new HashMap<>();
                employeeData.put("id", userId.toString());
                employeeData.put("name", user.getFullName());
                employeeData.put("email", user.getEmail());
                String roleValue = user.getRole() == User.Role.ADMIN
                        ? (user.getAdminRole() != null && !user.getAdminRole().isBlank()
                                ? user.getAdminRole()
                                : "ADMIN")
                        : (user.getRole() != null ? user.getRole().name() : "");
                employeeData.put("role", roleValue);
                employeeData.put("companyName", user.getCompanyName());

                List<Map<String, Object>> documents = userDocs.stream()
                        .map(doc -> {
                            Map<String, Object> docData = new HashMap<>();
                            docData.put("id", doc.getId());
                            docData.put("documentType", doc.getDocumentType().name());
                            docData.put("fileName", doc.getFileName());
                            docData.put("fileSize", formatFileSize(doc.getFileSize()));
                            docData.put("uploadedOn", doc.getUploadedAt().format(dateFormatter));
                            docData.put("fileUrl", resolveDocumentPath(doc));
                            docData.put("status", doc.getStatus().name());
                            return docData;
                        })
                        .collect(Collectors.toList());

                employeeData.put("documents", documents);
                result.add(employeeData);

            } catch (Exception ignored) {
            }
        }

        result.sort((a, b) -> ((String) a.get("name")).compareToIgnoreCase((String) b.get("name")));

        return result;
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("Cannot upload empty file");
        }

        long maxSize = 5 * 1024 * 1024;
        if (file.getSize() > maxSize) {
            throw new RuntimeException("File size exceeds 5MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || (!contentType.equals("application/pdf") && !contentType.startsWith("image/"))) {
            throw new RuntimeException("Only PDF and image files are allowed");
        }
    }

    private String resolveDocumentPath(Document document) {
        if (document.getId() != null && FileStorageUtil.hasData(document.getFileData())) {
            return buildDocumentPath(document.getId());
        }
        return document.getFilePath();
    }

    private String buildDocumentPath(Long documentId) {
        return "/api/documents/download/" + documentId;
    }

    private String formatFileSize(Long bytes) {
        if (bytes == null || bytes == 0) return "0 KB";
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format("%.2f KB", bytes / 1024.0);
        return String.format("%.2f MB", bytes / (1024.0 * 1024.0));
    }

    public String getCurrentUserPassportPhotoUrl() {
        try {
            org.springframework.security.core.Authentication authentication =
                    SecurityContextHolder.getContext().getAuthentication();
            String email = authentication.getName();

            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Document passportPhoto = documentRepository
                    .findByUserIdAndDocumentType(user.getId(), Document.DocumentType.PASSPORT_PHOTO)
                    .stream()
                    .findFirst()
                    .orElse(null);

            if (passportPhoto != null) {
                return resolveDocumentPath(passportPhoto);
            }

            return null;

        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
}
