package com.hireconnect.dto.response;

public class FingerprintVerificationResponse {

    private boolean verified;
    private boolean attendanceActivated;
    private String employeeId;
    private String moduleKey;
    private String deviceName;
    private String location;
    private Long companyId;

    public boolean isVerified() {
        return verified;
    }

    public void setVerified(boolean verified) {
        this.verified = verified;
    }

    public boolean isAttendanceActivated() {
        return attendanceActivated;
    }

    public void setAttendanceActivated(boolean attendanceActivated) {
        this.attendanceActivated = attendanceActivated;
    }

    public String getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(String employeeId) {
        this.employeeId = employeeId;
    }

    public String getModuleKey() {
        return moduleKey;
    }

    public void setModuleKey(String moduleKey) {
        this.moduleKey = moduleKey;
    }

    public String getDeviceName() {
        return deviceName;
    }

    public void setDeviceName(String deviceName) {
        this.deviceName = deviceName;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public Long getCompanyId() {
        return companyId;
    }

    public void setCompanyId(Long companyId) {
        this.companyId = companyId;
    }
}
