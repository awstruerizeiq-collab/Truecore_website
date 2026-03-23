package com.hireconnect.dto.request;

import java.util.List;

public class TeamLeadTaskUpsertRequest {
    private String title;
    private String description;
    private String priority;
    private String dueDate;
    private String assignType;
    private String links; // JSON array string from frontend
    private List<String> assignees;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public String getDueDate() { return dueDate; }
    public void setDueDate(String dueDate) { this.dueDate = dueDate; }

    public String getAssignType() { return assignType; }
    public void setAssignType(String assignType) { this.assignType = assignType; }

    public String getLinks() { return links; }
    public void setLinks(String links) { this.links = links; }

    public List<String> getAssignees() { return assignees; }
    public void setAssignees(List<String> assignees) { this.assignees = assignees; }
}