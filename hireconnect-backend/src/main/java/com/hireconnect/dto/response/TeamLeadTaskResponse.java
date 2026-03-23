package com.hireconnect.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class TeamLeadTaskResponse {
    private Long id;
    private String title;
    private String description;
    private String priority;
    private String status;
    private String assignType;
    private LocalDate dueDate;
    private List<String> assignees;
    private List<String> links;
    private String attachmentName;
    private String attachmentUrl;
    private boolean canEdit;
    private List<TeamLeadTaskEntryResponse> comments;
    private List<TeamLeadTaskEntryResponse> progress;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getAssignType() { return assignType; }
    public void setAssignType(String assignType) { this.assignType = assignType; }

    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }

    public List<String> getAssignees() { return assignees; }
    public void setAssignees(List<String> assignees) { this.assignees = assignees; }

    public List<String> getLinks() { return links; }
    public void setLinks(List<String> links) { this.links = links; }

    public String getAttachmentName() { return attachmentName; }
    public void setAttachmentName(String attachmentName) { this.attachmentName = attachmentName; }

    public String getAttachmentUrl() { return attachmentUrl; }
    public void setAttachmentUrl(String attachmentUrl) { this.attachmentUrl = attachmentUrl; }

    public boolean isCanEdit() { return canEdit; }
    public void setCanEdit(boolean canEdit) { this.canEdit = canEdit; }

    public List<TeamLeadTaskEntryResponse> getComments() { return comments; }
    public void setComments(List<TeamLeadTaskEntryResponse> comments) { this.comments = comments; }

    public List<TeamLeadTaskEntryResponse> getProgress() { return progress; }
    public void setProgress(List<TeamLeadTaskEntryResponse> progress) { this.progress = progress; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}