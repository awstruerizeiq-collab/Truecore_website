package com.hireconnect.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

@Entity
@Table(
    name = "holidays",
    indexes = {
        @Index(name = "idx_holidays_tenant_company_date", columnList = "tenant_code,company_id,holiday_date")
    }
)
public class Holiday {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "holiday_date", nullable = false)
    private LocalDate date;

    @Column(name = "tags_csv", columnDefinition = "TEXT")
    private String tagsCsv;

    @Column(name = "tenant_code", nullable = false, length = 100)
    private String tenantCode;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public LocalDate getHolidayDate() {
        return date;
    }

    public void setHolidayDate(LocalDate holidayDate) {
        this.date = holidayDate;
    }

    public String getTagsCsv() {
        return tagsCsv;
    }

    public void setTagsCsv(String tagsCsv) {
        this.tagsCsv = tagsCsv;
    }

    public String getType() {
        if (tagsCsv == null || tagsCsv.isBlank()) {
            return "Company";
        }
        String[] parts = tagsCsv.split(",", 2);
        String value = parts.length == 0 ? "" : parts[0].trim();
        return value.isEmpty() ? "Company" : value;
    }

    public void setType(String type) {
        String normalized = type == null ? "" : type.trim();
        this.tagsCsv = normalized;
    }

    public String getNotes() {
        return "";
    }

    public void setNotes(String notes) {
        // Compatibility no-op for older service/controller code paths.
    }

    public String getTenantCode() {
        return tenantCode;
    }

    public void setTenantCode(String tenantCode) {
        this.tenantCode = tenantCode;
    }

    public Long getCompanyId() {
        return companyId;
    }

    public void setCompanyId(Long companyId) {
        this.companyId = companyId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
