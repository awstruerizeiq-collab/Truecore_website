package com.hireconnect.dto.response;

public class FinanceDecisionResponse {
    private String tenantCode;
    private String decision;
    private int payslipsGeneratedCount;
    private int holdsCount;

    public FinanceDecisionResponse() {}

    public FinanceDecisionResponse(String tenantCode, String decision, int payslipsGeneratedCount, int holdsCount) {
        this.tenantCode = tenantCode;
        this.decision = decision;
        this.payslipsGeneratedCount = payslipsGeneratedCount;
        this.holdsCount = holdsCount;
    }

    public String getTenantCode() {
        return tenantCode;
    }

    public void setTenantCode(String tenantCode) {
        this.tenantCode = tenantCode;
    }

    public String getDecision() {
        return decision;
    }

    public void setDecision(String decision) {
        this.decision = decision;
    }

    public int getPayslipsGeneratedCount() {
        return payslipsGeneratedCount;
    }

    public void setPayslipsGeneratedCount(int payslipsGeneratedCount) {
        this.payslipsGeneratedCount = payslipsGeneratedCount;
    }

    public int getHoldsCount() {
        return holdsCount;
    }

    public void setHoldsCount(int holdsCount) {
        this.holdsCount = holdsCount;
    }
}
