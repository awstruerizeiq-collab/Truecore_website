package com.hireconnect.dto.request;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class PayslipGeneratorConfigRequest {

    private Long companyId;
    private String tenantCode;
    private String templateVariant;
    private List<ComponentItem> components = new ArrayList<>();

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