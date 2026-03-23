package com.hireconnect.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.hireconnect.dto.response.ApiResponse;
import com.hireconnect.entity.Document;
import com.hireconnect.service.DocumentService;

import io.swagger.v3.oas.annotations.parameters.RequestBody;

@RestController
@RequestMapping("/api/documents")
@CrossOrigin(origins = "*")
public class DocumentController {
    
    @Autowired
    private DocumentService documentService;
    
    @GetMapping("/admin/all-documents")
    @PreAuthorize("hasAnyRole('ADMIN','GLOBAL_ADMIN')")
    public ResponseEntity<?> getAllDocumentsGroupedByEmployee(
            @RequestHeader(value = "X-Tenant-Code", required = false) String tenantHeader,
            @RequestHeader(value = "X-Company-Id", required = false) Long companyHeader,
            @RequestParam(value = "tenantCode", required = false) String tenantParam,
            @RequestParam(value = "companyId", required = false) Long companyParam
    ) {
        try {
            String tenantCode = tenantHeader != null ? tenantHeader : tenantParam;
            Long companyId = companyHeader != null ? companyHeader : companyParam;

            if (tenantCode == null || companyId == null) {
                throw new RuntimeException("tenantCode and companyId are required");
            }

            List<Map<String, Object>> employeeDocuments =
                    documentService.getAllDocumentsGroupedByEmployee(tenantCode, companyId);

            return ResponseEntity.ok(employeeDocuments);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to fetch documents: " + e.getMessage()));
        }
    }
    
    
    // Employee: Get their own documents
    @GetMapping("/my-documents")
    public ResponseEntity<ApiResponse<List<Document>>> getMyDocuments() {
        try {
            List<Document> documents = documentService.getCurrentUserDocuments();
            return ResponseEntity.ok(ApiResponse.success("Documents fetched successfully", documents));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to fetch documents: " + e.getMessage()));
        }
    }
    
    // Admin: Get all documents from all users
    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<Document>>> getAllDocuments() {
        try {
            List<Document> documents = documentService.getAllDocuments();
            return ResponseEntity.ok(ApiResponse.success("All documents fetched successfully", documents));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to fetch documents: " + e.getMessage()));
        }
    }
    
    // Admin: Get documents by specific user
    @GetMapping("/user/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<Document>>> getUserDocuments(@PathVariable Long userId) {
        try {
            List<Document> documents = documentService.getUserDocuments(userId);
            return ResponseEntity.ok(ApiResponse.success("User documents fetched successfully", documents));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to fetch user documents: " + e.getMessage()));
        }
    }
    
    // Employee: Upload their own document
    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<Document>> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam("documentType") String documentType) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("File is empty"));
            }
            
            Document document = documentService.uploadDocument(file, documentType);
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Document uploaded successfully", document));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to upload document: " + e.getMessage()));
        }
    }
    
    // Admin: Upload document for specific user
    @PostMapping("/upload/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Document>> uploadDocumentForUser(
            @PathVariable Long userId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("documentType") String documentType) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("File is empty"));
            }
            
            Document document = documentService.uploadDocumentForUser(userId, file, documentType);
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Document uploaded successfully for user", document));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to upload document: " + e.getMessage()));
        }
    }
    
    // Both: Download document (employee can only download their own, admin can download any)
    @GetMapping("/download/{id}")
    public ResponseEntity<org.springframework.core.io.Resource> downloadDocument(@PathVariable Long id) {
        try {
            return documentService.downloadDocument(id);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    // Get single document details
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Document>> getDocument(@PathVariable Long id) {
        try {
            Document document = documentService.getDocumentById(id);
            return ResponseEntity.ok(ApiResponse.success("Document fetched successfully", document));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to fetch document: " + e.getMessage()));
        }
    }
    
    // Employee: Update their own document (replace file)
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Document>> updateDocument(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("File is empty"));
            }
            
            Document document = documentService.updateDocument(id, file);
            return ResponseEntity.ok(ApiResponse.success("Document updated successfully", document));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to update document: " + e.getMessage()));
        }
    }
    
    // Admin: Update document status (approve/reject)
    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Document>> updateDocumentStatus(
            @PathVariable Long id,
            @RequestBody DocumentStatusUpdateRequest request) {
        try {
            Document document = documentService.updateDocumentStatus(
                id, 
                request.getStatus(), 
                request.getRemarks()
            );
            return ResponseEntity.ok(ApiResponse.success("Document status updated successfully", document));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to update document status: " + e.getMessage()));
        }
    }
    
    // Employee: Delete their own document
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteDocument(@PathVariable Long id) {
        try {
            documentService.deleteDocument(id);
            return ResponseEntity.ok(ApiResponse.success("Document deleted successfully", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to delete document: " + e.getMessage()));
        }
    }
    
    // Admin: Force delete any document
    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','GLOBAL_ADMIN')")
    public ResponseEntity<ApiResponse<String>> adminDeleteDocument(@PathVariable Long id) {
        try {
            documentService.adminDeleteDocument(id);
            return ResponseEntity.ok(ApiResponse.success("Document deleted successfully by admin", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to delete document: " + e.getMessage()));
        }
    }
    
    @GetMapping("/my-passport-photo")
    public ResponseEntity<ApiResponse<String>> getMyPassportPhoto() {

        String photoUrl = documentService.getCurrentUserPassportPhotoUrl();

        return ResponseEntity.ok(
            ApiResponse.success("Passport photo fetched", photoUrl)
        );
    }


    
    // Admin: Get documents by status
    @GetMapping("/status/{status}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<Document>>> getDocumentsByStatus(
            @PathVariable String status) {
        try {
            List<Document> documents = documentService.getDocumentsByStatus(status);
            return ResponseEntity.ok(ApiResponse.success("Documents fetched by status", documents));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to fetch documents: " + e.getMessage()));
        }
        
        
    }
    
    // Inner class for status update request
    public static class DocumentStatusUpdateRequest {
        private String status;
        private String remarks;
        
        public String getStatus() {
            return status;
        }
        
        public void setStatus(String status) {
            this.status = status;
        }
        
        public String getRemarks() {
            return remarks;
        }
        
        public void setRemarks(String remarks) {
            this.remarks = remarks;
        }
    }

}
