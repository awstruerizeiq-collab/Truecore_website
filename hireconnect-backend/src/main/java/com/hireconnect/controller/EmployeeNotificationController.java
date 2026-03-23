package com.hireconnect.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hireconnect.dto.response.EmployeeNotificationResponse;
import com.hireconnect.service.NotificationService;

@RestController
@RequestMapping("/api/employee/notifications")
@CrossOrigin(
	    origins = {"http://localhost:5173", "http://localhost:3000", "https://app.truecorehr.com"},
	    allowCredentials = "true"
	)
public class EmployeeNotificationController {
@Autowired
    private  NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<EmployeeNotificationResponse>> getMyNotifications(
            Authentication auth) {

        if (auth == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String employeeId = auth.getName();

        // Fetch the real department, or default to "ALL" if unknown/not found
        String department = getDepartmentForUser(employeeId);

        return ResponseEntity.ok(
                notificationService.getNotificationsForEmployee(employeeId, department)
        );
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markRead(
            @PathVariable Long id,
            Authentication auth) {

        if (auth == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        notificationService.markAsRead(id, auth.getName());
        return ResponseEntity.ok().build();
    }

    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllRead(Authentication auth) {

        if (auth == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        notificationService.markAllRead(auth.getName());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/acknowledge")
    public ResponseEntity<Void> acknowledge(
            @PathVariable Long id,
            Authentication auth) {

        if (auth == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        notificationService.acknowledge(id, auth.getName());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> dismiss(
            @PathVariable Long id,
            Authentication auth) {

        if (auth == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        notificationService.dismiss(id, auth.getName());
        return ResponseEntity.ok().build();
    }

    // --- Helper Method ---
    private String getDepartmentForUser(String empId) {
        return "ALL";
    }
    
    //Production 
    
//    private String getDepartmentForUser(String email) {
//        User user = userService.findByEmail(email);
//        return user != null && user.getDepartment() != null
//                ? user.getDepartment()
//                : "ALL";
//    }

}
