package com.hireconnect.dto.request;

import java.util.Map;

public class EarnedLeaveQuarterUpdateRequest {

    private Integer year;
    private String quarter;
    private Map<String, Double> monthValues;

    public Integer getYear() {
        return year;
    }

    public void setYear(Integer year) {
        this.year = year;
    }

    public String getQuarter() {
        return quarter;
    }

    public void setQuarter(String quarter) {
        this.quarter = quarter;
    }

    public Map<String, Double> getMonthValues() {
        return monthValues;
    }

    public void setMonthValues(Map<String, Double> monthValues) {
        this.monthValues = monthValues;
    }
}
