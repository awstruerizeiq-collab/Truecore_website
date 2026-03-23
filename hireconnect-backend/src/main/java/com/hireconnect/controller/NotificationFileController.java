package com.hireconnect.controller;

import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hireconnect.service.NotificationService;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(
        origins = {"http://localhost:5173", "http://localhost:3000", "https://app.truecorehr.com"},
        allowCredentials = "true"
)
public class NotificationFileController {

    private final NotificationService notificationService;

    public NotificationFileController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping("/{id}/attachment")
    public ResponseEntity<Resource> downloadAttachment(@PathVariable Long id) {
        try {
            return notificationService.downloadAttachment(id);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
