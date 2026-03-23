package com.hireconnect.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.hireconnect.entity.Document;
import com.hireconnect.entity.Document.DocumentType;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {
	

    // Find documents by user ID
    List<Document> findByUserId(Long userId);
    
    Optional<Document> findByUserIdAndDocumentType(
        Long userId,
        DocumentType docType
    );
    
    void deleteByUserIdAndDocumentType(
        Long userId,
        Document.DocumentType documentType
    );
    
    List<Document> findByUserIdOrderByUploadedAtDesc(Long userId);
    
    // Find documents by status
    List<Document> findByStatus(Document.DocumentStatus status);
    
    List<Document> findByStatusOrderByUploadedAtDesc(Document.DocumentStatus status);
    
    // Find documents by user and status
    List<Document> findByUserIdAndStatus(Long userId, Document.DocumentStatus status);
    
    List<Document> findByUserIdAndStatusOrderByUploadedAtDesc(
        Long userId, 
        Document.DocumentStatus status
    );
    
    // Get all documents ordered by upload date
    List<Document> findAllByOrderByUploadedAtDesc();
    
    // Find pending documents (for admin review)
    @Query("SELECT d FROM Document d WHERE d.status = 'SUBMITTED' OR d.status = 'PENDING' ORDER BY d.uploadedAt ASC")
    List<Document> findPendingDocuments();
    
    // Find documents by approver
    List<Document> findByApprovedBy(Long approvedBy);
    
    List<Document> findByApprovedByOrderByApprovedAtDesc(Long approvedBy);
    
    // Count documents by user
    @Query("SELECT COUNT(d) FROM Document d WHERE d.userId = :userId")
    long countByUserId(@Param("userId") Long userId);
    
    // Count documents by user and status
    @Query("SELECT COUNT(d) FROM Document d WHERE d.userId = :userId AND d.status = :status")
    long countByUserIdAndStatus(
        @Param("userId") Long userId, 
        @Param("status") Document.DocumentStatus status
    );
    
    // Count documents by status
    @Query("SELECT COUNT(d) FROM Document d WHERE d.status = :status")
    long countByStatus(@Param("status") Document.DocumentStatus status);
    
    // Search documents by file name
    @Query("SELECT d FROM Document d WHERE " +
           "LOWER(d.fileName) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "ORDER BY d.uploadedAt DESC")
    List<Document> searchDocuments(@Param("query") String query);
    
    // Search documents by user
    @Query("SELECT d FROM Document d WHERE d.userId = :userId AND " +
           "LOWER(d.fileName) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "ORDER BY d.uploadedAt DESC")
    List<Document> searchDocumentsByUser(
        @Param("userId") Long userId, 
        @Param("query") String query
    );
    
    // Find documents that need approval (submitted or pending)
    @Query("SELECT d FROM Document d WHERE d.status IN ('SUBMITTED', 'PENDING') ORDER BY d.uploadedAt ASC")
    List<Document> findDocumentsNeedingApproval();
    
    // Get document statistics by user
    @Query("SELECT d.status, COUNT(d) FROM Document d WHERE d.userId = :userId GROUP BY d.status")
    List<Object[]> getDocumentStatsByUser(@Param("userId") Long userId);
    
    // Get overall document statistics
    @Query("SELECT d.status, COUNT(d) FROM Document d GROUP BY d.status")
    List<Object[]> getOverallDocumentStats();
    
    @Query("""
    	    SELECT d FROM Document d
    	    WHERE d.userId IN (
    	        SELECT u.id FROM User u
    	        WHERE u.tenantCode = :tenantCode
    	        AND u.companyId = :companyId
    	        AND u.deletedAt IS NULL
    	    )
    	    ORDER BY d.uploadedAt DESC
    	""")
    	List<Document> findAllByTenantCompany(
    	        @Param("tenantCode") String tenantCode,
    	        @Param("companyId") Long companyId
    	);

    
    
}