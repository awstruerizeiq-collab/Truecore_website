package com.hireconnect.dto.response;

public class GlobalAdminAuthResponse {
    private Long userId;
    private Long id;
    private String fullName;
    private String email;
    private String role;
    private String token;

    public GlobalAdminAuthResponse() {}

    public GlobalAdminAuthResponse(Long userId, String fullName, String email, String role, String token) {
        this.userId = userId;
        this.id = userId;
        this.fullName = fullName;
        this.email = email;
        this.role = role;
        this.token = token;
    }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; this.id = userId; }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; this.userId = id; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
}