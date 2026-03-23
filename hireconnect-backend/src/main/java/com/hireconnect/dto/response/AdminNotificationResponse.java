package com.hireconnect.dto.response;

import java.time.LocalDateTime;

import java.util.List;


public class AdminNotificationResponse {

    private Long id;
    private String title;
    private String message;
    private String priority;
    private String status;
    private boolean pinned;
    private boolean reqAck;
    private List<String> targetDepts;
    private List<String> targetEmployeeIds;
    private LocalDateTime createdAt;
    private LocalDateTime scheduledAt;
    private LocalDateTime expiresAt;
    private String attachmentName;
	public Long getId() {
		return id;
	}
	public void setId(Long id) {
		this.id = id;
	}
	public String getTitle() {
		return title;
	}
	public void setTitle(String title) {
		this.title = title;
	}
	public String getMessage() {
		return message;
	}
	public void setMessage(String message) {
		this.message = message;
	}
	public String getPriority() {
		return priority;
	}
	public void setPriority(String priority) {
		this.priority = priority;
	}
	public String getStatus() {
		return status;
	}
	public void setStatus(String status) {
		this.status = status;
	}
	public boolean isPinned() {
		return pinned;
	}
	public void setPinned(boolean pinned) {
		this.pinned = pinned;
	}
	public boolean isReqAck() {
		return reqAck;
	}
	public void setReqAck(boolean reqAck) {
		this.reqAck = reqAck;
	}
	public List<String> getTargetDepts() {
		return targetDepts;
	}
	public void setTargetDepts(List<String> targetDepts) {
		this.targetDepts = targetDepts;
	}
	public List<String> getTargetEmployeeIds() {
		return targetEmployeeIds;
	}
	public void setTargetEmployeeIds(List<String> targetEmployeeIds) {
		this.targetEmployeeIds = targetEmployeeIds;
	}
	public LocalDateTime getCreatedAt() {
		return createdAt;
	}
	public void setCreatedAt(LocalDateTime createdAt) {
		this.createdAt = createdAt;
	}
	public LocalDateTime getScheduledAt() {
		return scheduledAt;
	}
	public void setScheduledAt(LocalDateTime scheduledAt) {
		this.scheduledAt = scheduledAt;
	}
	public LocalDateTime getExpiresAt() {
		return expiresAt;
	}
	public void setExpiresAt(LocalDateTime expiresAt) {
		this.expiresAt = expiresAt;
	}
	public String getAttachmentName() {
		return attachmentName;
	}
	public void setAttachmentName(String attachmentName) {
		this.attachmentName = attachmentName;
	}
    
    

   
}