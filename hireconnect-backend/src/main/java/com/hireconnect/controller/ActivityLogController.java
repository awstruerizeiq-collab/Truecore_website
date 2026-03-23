// package com.hireconnect.controller;

// import java.time.Duration;
// import java.time.LocalDateTime;
// import java.util.List;

// import org.springframework.data.domain.PageRequest;
// import org.springframework.data.domain.Sort;
// import org.springframework.web.bind.annotation.*;

// import com.hireconnect.dto.response.ActivityLogResponse;
// import com.hireconnect.entity.ActivityLog;
// import com.hireconnect.repository.ActivityLogRepository;

// @RestController
// @RequestMapping("/api/global-admin")
// @CrossOrigin(origins = "*")
// public class ActivityLogController {

//     private final ActivityLogRepository repository;

//     public ActivityLogController(ActivityLogRepository repository) {
//         this.repository = repository;
//     }

//     // GET /api/global-admin/activity?limit=10
//     @GetMapping("/activity")
//     public List<ActivityLogResponse> getRecentActivities(
//             @RequestParam(defaultValue = "10") int limit,
//             @RequestParam(required = false) Long companyId,
//             @RequestParam(required = false) String eventType
//     ) {
//         int safeLimit = Math.max(1, Math.min(limit, 100));

//         var pageable = PageRequest.of(0, safeLimit, Sort.by(Sort.Direction.DESC, "createdAt"));

//         List<ActivityLog> logs;
//         if (companyId != null) {
//             logs = repository.findByCompanyIdOrderByCreatedAtDesc(companyId, pageable).getContent();
//         } else if (eventType != null && !eventType.trim().isEmpty()) {
//             logs = repository.findByEventTypeOrderByCreatedAtDesc(eventType.trim(), pageable).getContent();
//         } else {
//             logs = repository.findAllByOrderByCreatedAtDesc(pageable).getContent();
//         }

//         return logs.stream().map(this::toResponse).toList();
//     }

//     private ActivityLogResponse toResponse(ActivityLog a) {
//         ActivityLogResponse r = new ActivityLogResponse();
//         r.setId(a.getId());
//         r.setEventType(a.getEventType());
//         r.setTag(a.getTag() != null ? a.getTag() : defaultTag(a.getEventType()));
//         r.setSeverity(a.getSeverity());
//         r.setMessage(a.getMessage());
//         r.setCompanyId(a.getCompanyId());
//         r.setTenantCode(a.getTenantCode());
//         r.setActorUserId(a.getActorUserId());
//         r.setActorName(a.getActorName());
//         r.setCreatedAt(a.getCreatedAt());
//         r.setTimeAgo(toTimeAgo(a.getCreatedAt()));
//         return r;
//     }

//     private String defaultTag(String eventType) {
//         if (eventType == null) return "Activity";
//         String e = eventType.toUpperCase();
//         if (e.contains("DEMO")) return "Demo";
//         if (e.contains("COMPANY")) return "Company";
//         if (e.contains("SUBSCRIPTION")) return "Subscription";
//         if (e.contains("PAYMENT")) return "Payment";
//         if (e.contains("TICKET")) return "Support";
//         return "Activity";
//     }

//     private String toTimeAgo(LocalDateTime createdAt) {
//         if (createdAt == null) return "-";
//         Duration d = Duration.between(createdAt, LocalDateTime.now());
//         long seconds = Math.max(0, d.getSeconds());

//         if (seconds < 60) return seconds + " sec ago";
//         long minutes = seconds / 60;
//         if (minutes < 60) return minutes + " min ago";
//         long hours = minutes / 60;
//         if (hours < 24) return hours + " hours ago";
//         long days = hours / 24;
//         return days + " days ago";
//     }
// }


// //package com.hireconnect.controller;
// //
// //import java.time.Duration;
// //import java.time.LocalDateTime;
// //import java.util.ArrayList;
// //import java.util.HashMap;
// //import java.util.List;
// //import java.util.Map;
// //import java.util.stream.Collectors;
// //
// //import org.springframework.beans.factory.annotation.Autowired;
// //import org.springframework.data.domain.Page;
// //import org.springframework.data.domain.PageRequest;
// //import org.springframework.data.domain.Pageable;
// //import org.springframework.http.HttpStatus;
// //import org.springframework.http.ResponseEntity;
// //import org.springframework.web.bind.annotation.CrossOrigin;
// //import org.springframework.web.bind.annotation.GetMapping;
// //import org.springframework.web.bind.annotation.RequestMapping;
// //import org.springframework.web.bind.annotation.RequestMethod;
// //import org.springframework.web.bind.annotation.RequestParam;
// //import org.springframework.web.bind.annotation.RestController;
// //
// //import com.hireconnect.dto.response.ActivityLogResponse;
// //import com.hireconnect.entity.ActivityLog;
// //import com.hireconnect.repository.ActivityLogRepository;
// //
// ///**
// // * Activity Log Controller - Manages activity log endpoints
// // * 
// // * Base URL: /api/global-admin/activity-logs
// // * 
// // * Endpoints:
// // * - GET /api/global-admin/activity-logs - Get all activities (paginated)
// // * - GET /api/global-admin/activity-logs/by-company - Get activities for specific company
// // */
// //@RestController
// //@RequestMapping("/api/global-admin/activity-logs")
// //@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {
// //    RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, 
// //    RequestMethod.DELETE, RequestMethod.PATCH, RequestMethod.OPTIONS
// //})
// //public class ActivityLogController {
// //
// //    @Autowired
// //    private ActivityLogRepository activityLogRepository;
// //
// //    /**
// //     * Get recent activity logs (paginated)
// //     * Example: GET /api/global-admin/activity-logs?page=0&size=10
// //     */
// //    @GetMapping
// //    public ResponseEntity<Map<String, Object>> getRecentActivities(
// //            @RequestParam(defaultValue = "0") int page,
// //            @RequestParam(defaultValue = "10") int size) {
// //        
// //        Map<String, Object> response = new HashMap<>();
// //        
// //        try {
// //            System.out.println("ActivityLogController: Fetching activities - page=" + page + ", size=" + size);
// //            
// //            // Check if repository is null
// //            if (activityLogRepository == null) {
// //                System.err.println("ERROR: activityLogRepository is NULL!");
// //                response.put("success", false);
// //                response.put("message", "Repository not initialized");
// //                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
// //            }
// //            
// //            Pageable pageable = PageRequest.of(page, size);
// //            Page<ActivityLog> activityPage = activityLogRepository
// //                .findAllByOrderByCreatedAtDesc(pageable);
// //            
// //            System.out.println("ActivityLogController: Found " + activityPage.getTotalElements() + " activities");
// //            
// //            List<ActivityLogResponse> activities = activityPage.getContent()
// //                .stream()
// //                .map(this::mapToResponse)
// //                .collect(Collectors.toList());
// //            
// //            response.put("success", true);
// //            response.put("message", "Activities fetched successfully");
// //            response.put("data", activities);
// //            response.put("totalPages", activityPage.getTotalPages());
// //            response.put("totalElements", activityPage.getTotalElements());
// //            response.put("currentPage", activityPage.getNumber());
// //            
// //            return ResponseEntity.ok(response);
// //            
// //        } catch (Exception e) {
// //            System.err.println("ERROR in ActivityLogController.getRecentActivities:");
// //            e.printStackTrace();
// //            
// //            response.put("success", false);
// //            response.put("message", "Failed to fetch activities: " + e.getMessage());
// //            response.put("error", e.getClass().getSimpleName());
// //            
// //            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
// //        }
// //    }
// //
// //    /**
// //     * Get activities for a specific company
// //     * Example: GET /api/global-admin/activity-logs/by-company?companyId=1&page=0&size=10
// //     */
// //    @GetMapping("/by-company")
// //    public ResponseEntity<Map<String, Object>> getActivitiesByCompany(
// //            @RequestParam Long companyId,
// //            @RequestParam(defaultValue = "0") int page,
// //            @RequestParam(defaultValue = "10") int size) {
// //        
// //        Map<String, Object> response = new HashMap<>();
// //        
// //        try {
// //            System.out.println("ActivityLogController: Fetching activities for company " + companyId);
// //            
// //            if (activityLogRepository == null) {
// //                System.err.println("ERROR: activityLogRepository is NULL!");
// //                response.put("success", false);
// //                response.put("message", "Repository not initialized");
// //                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
// //            }
// //            
// //            Pageable pageable = PageRequest.of(page, size);
// //            Page<ActivityLog> activityPage = activityLogRepository
// //                .findByCompanyIdOrderByCreatedAtDesc(companyId, pageable);
// //            
// //            List<ActivityLogResponse> activities = activityPage.getContent()
// //                .stream()
// //                .map(this::mapToResponse)
// //                .collect(Collectors.toList());
// //            
// //            response.put("success", true);
// //            response.put("message", "Company activities fetched successfully");
// //            response.put("data", activities);
// //            response.put("totalPages", activityPage.getTotalPages());
// //            response.put("totalElements", activityPage.getTotalElements());
// //            
// //            return ResponseEntity.ok(response);
// //            
// //        } catch (Exception e) {
// //            System.err.println("ERROR in ActivityLogController.getActivitiesByCompany:");
// //            e.printStackTrace();
// //            
// //            response.put("success", false);
// //            response.put("message", "Failed to fetch company activities: " + e.getMessage());
// //            
// //            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
// //        }
// //    }
// //
// //    /**
// //     * Health check endpoint - verify controller is working
// //     */
// //    @GetMapping("/health")
// //    public ResponseEntity<Map<String, Object>> healthCheck() {
// //        Map<String, Object> response = new HashMap<>();
// //        response.put("success", true);
// //        response.put("message", "ActivityLogController is working!");
// //        response.put("timestamp", LocalDateTime.now());
// //        response.put("repositoryStatus", activityLogRepository != null ? "Connected" : "NULL");
// //        
// //        System.out.println("ActivityLogController: Health check called");
// //        
// //        return ResponseEntity.ok(response);
// //    }
// //
// //    /**
// //     * Helper method to convert ActivityLog entity to response DTO
// //     */
// //    private ActivityLogResponse mapToResponse(ActivityLog log) {
// //        ActivityLogResponse dto = new ActivityLogResponse();
// //        dto.setId(log.getId());
// //        dto.setEventType(log.getEventType());
// //        dto.setMessage(log.getMessage());
// //        dto.setSeverity(log.getSeverity());
// //        dto.setTag(log.getTag());
// //        dto.setCompanyId(log.getCompanyId());
// //        dto.setTenantCode(log.getTenantCode());
// //        dto.setActorUserId(log.getActorUserId());
// //        dto.setActorName(log.getActorName());
// //        dto.setCreatedAt(log.getCreatedAt());
// //        dto.setTimeAgo(formatTimeAgo(log.getCreatedAt()));
// //        return dto;
// //    }
// //
// //    /**
// //     * Format timestamp to human-readable "time ago" string
// //     */
// //    private String formatTimeAgo(LocalDateTime timestamp) {
// //        if (timestamp == null) return "Unknown";
// //        
// //        LocalDateTime now = LocalDateTime.now();
// //        Duration duration = Duration.between(timestamp, now);
// //        
// //        long seconds = duration.getSeconds();
// //        long minutes = duration.toMinutes();
// //        long hours = duration.toHours();
// //        long days = duration.toDays();
// //        
// //        if (seconds < 60) {
// //            return seconds + " sec ago";
// //        } else if (minutes < 60) {
// //            return minutes + " min ago";
// //        } else if (hours < 24) {
// //            return hours + " hour" + (hours > 1 ? "s" : "") + " ago";
// //        } else if (days < 30) {
// //            return days + " day" + (days > 1 ? "s" : "") + " ago";
// //        } else {
// //            long months = days / 30;
// //            return months + " month" + (months > 1 ? "s" : "") + " ago";
// //        }
// //    }
// //}