package com.hireconnect.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "tax_declarations")
public class TaxDeclaration {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "financial_year")
    private String financialYear;

    @Column(name = "section_80c", precision = 10, scale = 2)
    private BigDecimal section80c;

    @Column(name = "section_80d", precision = 10, scale = 2)
    private BigDecimal section80d;

    @Column(name = "hra_exemption", precision = 10, scale = 2)
    private BigDecimal hraExemption;

    @Column(name = "other_exemptions", precision = 10, scale = 2)
    private BigDecimal otherExemptions;

    @Enumerated(EnumType.STRING)
    private TaxStatus status = TaxStatus.PENDING;

    @Column(name = "approved_by")
    private Long approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum TaxStatus {
        PENDING, APPROVED, REJECTED
    }

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public Long getUserId() {
		return userId;
	}

	public void setUserId(Long userId) {
		this.userId = userId;
	}

	public String getFinancialYear() {
		return financialYear;
	}

	public void setFinancialYear(String financialYear) {
		this.financialYear = financialYear;
	}

	public BigDecimal getSection80c() {
		return section80c;
	}

	public void setSection80c(BigDecimal section80c) {
		this.section80c = section80c;
	}

	public BigDecimal getSection80d() {
		return section80d;
	}

	public void setSection80d(BigDecimal section80d) {
		this.section80d = section80d;
	}

	public BigDecimal getHraExemption() {
		return hraExemption;
	}

	public void setHraExemption(BigDecimal hraExemption) {
		this.hraExemption = hraExemption;
	}

	public BigDecimal getOtherExemptions() {
		return otherExemptions;
	}

	public void setOtherExemptions(BigDecimal otherExemptions) {
		this.otherExemptions = otherExemptions;
	}

	public TaxStatus getStatus() {
		return status;
	}

	public void setStatus(TaxStatus status) {
		this.status = status;
	}

	public Long getApprovedBy() {
		return approvedBy;
	}

	public void setApprovedBy(Long approvedBy) {
		this.approvedBy = approvedBy;
	}

	public LocalDateTime getApprovedAt() {
		return approvedAt;
	}

	public void setApprovedAt(LocalDateTime approvedAt) {
		this.approvedAt = approvedAt;
	}

	public String getRejectionReason() {
		return rejectionReason;
	}

	public void setRejectionReason(String rejectionReason) {
		this.rejectionReason = rejectionReason;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(LocalDateTime createdAt) {
		this.createdAt = createdAt;
	}
    
}
