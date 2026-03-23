package com.hireconnect.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "breaks")
public class Break {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "session_id", nullable = false)
    private Long sessionId;

    @Column(name = "break_start")
    private LocalDateTime breakStart;

    @Column(name = "break_end")
    private LocalDateTime breakEnd;

    @Column(name = "duration_seconds")
    private Integer durationSeconds;

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public Long getSessionId() {
		return sessionId;
	}

	public void setSessionId(Long sessionId) {
		this.sessionId = sessionId;
	}

	public LocalDateTime getBreakStart() {
		return breakStart;
	}

	public void setBreakStart(LocalDateTime breakStart) {
		this.breakStart = breakStart;
	}

	public LocalDateTime getBreakEnd() {
		return breakEnd;
	}

	public void setBreakEnd(LocalDateTime breakEnd) {
		this.breakEnd = breakEnd;
	}

	public Integer getDurationSeconds() {
		return durationSeconds;
	}

	public void setDurationSeconds(Integer durationSeconds) {
		this.durationSeconds = durationSeconds;
	}
    
    
}
