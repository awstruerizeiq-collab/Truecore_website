package com.hireconnect.controller;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hireconnect.entity.User;
import com.hireconnect.service.UserService;

@RestController
@RequestMapping("/api/public")
@CrossOrigin(origins = "*")
public class HealthController {
	
	@Autowired
	private UserService userService;
    
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health()
    {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("message", "HRMS Backend is running");
        health.put("timestamp", LocalDateTime.now());
        health.put("version", "1.0.0");
        return ResponseEntity.ok(health);
    }
    
    @GetMapping("/ping")
    public ResponseEntity<Map<String, String>> ping()
    {
        Map<String, String> response = new HashMap<>();
        response.put("message", "pong");
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/allUsers")
    public ResponseEntity<List<User>> allUsers()
    {
    	List<User> allUsers = userService.getAllUsers();
    	return ResponseEntity.ok(allUsers);
    }
}