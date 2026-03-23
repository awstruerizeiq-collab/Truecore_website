package com.hireconnect.dto.request;

import java.util.ArrayList;
import java.util.List;

public class PayslipBulkGenerateRequest {
    private List<Long> payrollIds = new ArrayList<>();

    public List<Long> getPayrollIds() {
        return payrollIds;
    }

    public void setPayrollIds(List<Long> payrollIds) {
        this.payrollIds = payrollIds;
    }
}

