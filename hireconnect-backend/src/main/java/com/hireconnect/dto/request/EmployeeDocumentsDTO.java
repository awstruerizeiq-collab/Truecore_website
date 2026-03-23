package com.hireconnect.dto.request;

import java.util.List;

public  class EmployeeDocumentsDTO {
    private Long id;
    private String name;
    private String email;
    private List<DocumentDTO> documents;
    
    public EmployeeDocumentsDTO() {}
    
    public EmployeeDocumentsDTO(Long id, String name, String email, List<DocumentDTO> documents) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.documents = documents;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public List<DocumentDTO> getDocuments() { return documents; }
    public void setDocuments(List<DocumentDTO> documents) { this.documents = documents; }
}