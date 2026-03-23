package com.hireconnect.controller;

import java.io.IOException;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.hireconnect.dto.request.NotificationRequest;
import com.hireconnect.dto.response.AdminNotificationResponse;
import com.hireconnect.entity.Notification;
import com.hireconnect.service.NotificationService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/notifications")
@RequiredArgsConstructor
@CrossOrigin(
	    origins = {"http://localhost:5173", "http://localhost:3000", "https://app.truecorehr.com"},
	    allowCredentials = "true"
	)

public class AdminNotificationController {
@Autowired
    private  NotificationService service;

    // ================= FETCH =================

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AdminNotificationResponse>> getAll() {
        return ResponseEntity.ok(service.getAllAdminNotifications());
    }


    // ================= CREATE =================

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Notification> create(
            @ModelAttribute NotificationRequest request,
            @RequestParam(value = "attachment", required = false) MultipartFile attachment) {

        try {
            Notification created = service.createNotification(request, attachment);
            return ResponseEntity.ok(created);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ================= UPDATE =================

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Notification> update(
            @PathVariable Long id,
            @ModelAttribute NotificationRequest request,
            @RequestParam(value = "attachment", required = false) MultipartFile attachment) {

        try {
            Notification updated =
                    service.updateNotification(id, request, attachment);
            return ResponseEntity.ok(updated);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ================= DELETE =================

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.deleteNotification(id);
        return ResponseEntity.ok().build();
    }

    // ================= ARCHIVE =================

    @PatchMapping("/{id}/archive")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> archive(@PathVariable Long id) {
        service.archiveNotification(id);
        return ResponseEntity.ok().build();
    }
    
}