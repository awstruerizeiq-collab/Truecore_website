package com.hireconnect.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.hireconnect.dto.request.AttendanceRequest;
import com.hireconnect.dto.request.LeaveRequest;
import com.hireconnect.dto.request.TimesheetRequest;
import com.hireconnect.dto.response.ApiResponse;
import com.hireconnect.dto.response.AttendanceResponse;
import com.hireconnect.entity.AttendanceSession;
import com.hireconnect.service.AttendanceService;

@RestController
@RequestMapping("/api/attendance")
@CrossOrigin(origins = "*")
public class AttendanceController {
    
	@Autowired
    private  AttendanceService attendanceService;
	


	@PostMapping("/start-work")
    public ResponseEntity<ApiResponse<AttendanceSession>> startWork(@RequestBody AttendanceRequest request) {
        try {
            AttendanceSession session = attendanceService.startWork(request.getEmployeeId());
            return ResponseEntity.ok(ApiResponse.success("Work session started successfully", session));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PostMapping("/break-start")
    public ResponseEntity<ApiResponse<String>> breakStart(@RequestBody AttendanceRequest request) {
        try {
            attendanceService.startBreak(request.getEmployeeId());
            return ResponseEntity.ok(ApiResponse.success("Break started successfully", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PostMapping("/break-resume")
    public ResponseEntity<ApiResponse<String>> breakResume(@RequestBody AttendanceRequest request) {
        try {
            attendanceService.resumeWork(request.getEmployeeId());
            return ResponseEntity.ok(ApiResponse.success("Work resumed successfully", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PostMapping("/end-work")
    public ResponseEntity<ApiResponse<AttendanceSession>> endWork(@RequestBody AttendanceRequest request) {
        try {
            AttendanceSession session = attendanceService.endWork(request.getEmployeeId());
            return ResponseEntity.ok(ApiResponse.success("Work session ended successfully", session));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PostMapping("/save-timesheet")
    public ResponseEntity<ApiResponse<String>> saveTimesheet(@RequestBody TimesheetRequest request) {
        try {
            attendanceService.saveTimesheet(request);
            return ResponseEntity.ok(ApiResponse.success("Timesheet submitted successfully", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/today/{employeeId}")
    public ResponseEntity<ApiResponse<AttendanceResponse>> getTodayAttendance(@PathVariable Long employeeId) {
        try {
            AttendanceResponse response = attendanceService.getTodayAttendance(employeeId);
            return ResponseEntity.ok(ApiResponse.success("Today's attendance fetched", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/calendar/{employeeId}/{year}/{month}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCalendarData(
            @PathVariable Long employeeId,
            @PathVariable Integer year,
            @PathVariable Integer month) {
        try {
            Map<String, Object> calendarData = attendanceService.getCalendarData(employeeId, year, month);
            return ResponseEntity.ok(ApiResponse.success("Calendar data fetched", calendarData));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/holidays/{employeeId}")
    public ResponseEntity<ApiResponse<?>> getEmployeeHolidays(
            @PathVariable Long employeeId,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {
        try {
            var holidays = attendanceService.getEmployeeHolidays(employeeId, year, month);
            return ResponseEntity.ok(ApiResponse.success("Employee holidays fetched", holidays));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    
    @GetMapping("/monthly")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMonthlyAttendance(
            @RequestParam Long employeeId,
            @RequestParam Integer year,
            @RequestParam Integer month) {
        try {
            Map<String, Object> monthlyData = attendanceService.getMonthlyAttendance(employeeId, year, month);
            return ResponseEntity.ok(ApiResponse.success("Monthly attendance fetched", monthlyData));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/summary/{employeeId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAttendanceSummary(@PathVariable Long employeeId) {
        try {
            Map<String, Object> summary = attendanceService.getAttendanceSummary(employeeId);
            return ResponseEntity.ok(ApiResponse.success("Summary fetched", summary));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PostMapping("/leave-request")
    public ResponseEntity<ApiResponse<String>> submitLeaveRequest(@RequestBody LeaveRequest request) {
        try {
            attendanceService.submitLeaveRequest(request);
            return ResponseEntity.ok(ApiResponse.success("Leave request submitted successfully", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PostMapping("/correction-request")
    public ResponseEntity<ApiResponse<String>> submitCorrectionRequest(@RequestBody AttendanceRequest request) {
        try {
            attendanceService.submitCorrectionRequest(request);
            return ResponseEntity.ok(ApiResponse.success("Correction request submitted successfully", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/history/{employeeId}")
    public ResponseEntity<ApiResponse<List<AttendanceSession>>> getAttendanceHistory(
            @PathVariable Long employeeId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        try {
            List<AttendanceSession> history = attendanceService.getAttendanceHistory(employeeId, startDate, endDate);
            return ResponseEntity.ok(ApiResponse.success("Attendance history fetched", history));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
