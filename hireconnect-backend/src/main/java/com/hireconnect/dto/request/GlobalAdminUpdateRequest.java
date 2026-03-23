package com.hireconnect.dto.request;

public class GlobalAdminUpdateRequest {
    private String fullName;
    private String email;
    private String password; // optional (if given, update password)

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}