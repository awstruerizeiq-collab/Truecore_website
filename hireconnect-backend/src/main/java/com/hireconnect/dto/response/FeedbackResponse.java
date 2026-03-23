package com.hireconnect.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FeedbackResponse {
    private Long id;
    private String title;
    private String comment;
    private String author;
    private String date;  // formatted date string
    
    
	public FeedbackResponse(Long id, String title, String comment, String author, String date) {
		super();
		this.id = id;
		this.title = title;
		this.comment = comment;
		this.author = author;
		this.date = date;
	}
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
	public String getComment() {
		return comment;
	}
	public void setComment(String comment) {
		this.comment = comment;
	}
	public String getAuthor() {
		return author;
	}
	public void setAuthor(String author) {
		this.author = author;
	}
	public String getDate() {
		return date;
	}
	public void setDate(String date) {
		this.date = date;
	}
    
    
}
