package com.hireconnect.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class PayslipGeneratorConfigResponse {

    private Long id;
    private Long companyId;
    private String tenantCode;
    private String templateVariant;
    private List<ComponentItem> components = new ArrayList<>();
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getCompanyId() {
        return companyId;
    }

    public void setCompanyId(Long companyId) {
        this.companyId = companyId;
    }

    public String getTenantCode() {
        return tenantCode;
    }

    public void setTenantCode(String tenantCode) {
        this.tenantCode = tenantCode;
    }

    public String getTemplateVariant() {
        return templateVariant;
    }

    public void setTemplateVariant(String templateVariant) {
        this.templateVariant = templateVariant;
    }

    public List<ComponentItem> getComponents() {
        return components;
    }

    public void setComponents(List<ComponentItem> components) {
        this.components = components;
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

    public static class ComponentItem {
        private String component;
        private String mode;
        private BigDecimal value;
        private String fieldKey;
        private String category;
        private List<String> linkedComponents = new ArrayList<>();
        private Map<String, BigDecimal> linkedPercentages = new HashMap<>();

        public String getComponent() {
            return component;
        }

        public void setComponent(String component) {
            this.component = component;
        }

        public String getMode() {
            return mode;
        }

        public void setMode(String mode) {
            this.mode = mode;
        }

        public BigDecimal getValue() {
            return value;
        }

        public void setValue(BigDecimal value) {
            this.value = value;
        }

        public String getFieldKey() {
            return fieldKey;
        }

        public void setFieldKey(String fieldKey) {
            this.fieldKey = fieldKey;
        }

        public String getCategory() {
            return category;
        }

        public void setCategory(String category) {
            this.category = category;
        }

        public List<String> getLinkedComponents() {
            return linkedComponents;
        }

        public void setLinkedComponents(List<String> linkedComponents) {
            this.linkedComponents = linkedComponents;
        }

        public Map<String, BigDecimal> getLinkedPercentages() {
            return linkedPercentages;
        }

        public void setLinkedPercentages(Map<String, BigDecimal> linkedPercentages) {
            this.linkedPercentages = linkedPercentages;
        }
    }
}