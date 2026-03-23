package com.hireconnect.service;


import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hireconnect.dto.request.BulkActionRequest;
import com.hireconnect.dto.request.ManualAttendanceRequest;
import com.hireconnect.dto.response.DashboardStatsResponse;
import com.hireconnect.entity.AttendanceSession;
import com.hireconnect.entity.Break;
import com.hireconnect.entity.CorrectionRequest;
import com.hireconnect.entity.Holiday;
import com.hireconnect.entity.Leave;
import com.hireconnect.entity.Timesheet;
import com.hireconnect.entity.User;
import com.hireconnect.repository.AttendanceSessionRepository;
import com.hireconnect.repository.BreakRepository;
import com.hireconnect.repository.CorrectionRequestRepository;
import com.hireconnect.repository.LeaveRepository;
import com.hireconnect.repository.TimesheetRepository;
import com.hireconnect.repository.UserRepository;

@Service
public class AdminAttendanceService {
    
    private  AttendanceSessionRepository attendanceSessionRepository;
    private  BreakRepository breakRepository;
    private  LeaveRepository leaveRepository;
    private  CorrectionRequestRepository correctionRequestRepository;
    private  UserRepository userRepository;
    private  TimesheetRepository timesheetRepository;
    private  HolidayService holidayService;

    @Autowired
    public AdminAttendanceService(
            AttendanceSessionRepository attendanceSessionRepository,
            BreakRepository breakRepository,
            LeaveRepository leaveRepository,
            CorrectionRequestRepository correctionRequestRepository,
            UserRepository userRepository,
            TimesheetRepository timesheetRepository,
            HolidayService holidayService
    ) {
        this.attendanceSessionRepository = attendanceSessionRepository;
        this.breakRepository = breakRepository;
        this.leaveRepository = leaveRepository;
        this.correctionRequestRepository = correctionRequestRepository;
        this.userRepository = userRepository;
        this.timesheetRepository = timesheetRepository;
        this.holidayService = holidayService;
    }
    

    public DashboardStatsResponse getDashboardStats() {
        DashboardStatsResponse stats = new DashboardStatsResponse();
        
        // Total employees
        long totalEmployees = userRepository.countByRole(User.Role.EMPLOYEE);
        stats.setTotalEmployees(totalEmployees);
        
        // Present today
        long presentToday = attendanceSessionRepository.countPresentToday();
        stats.setPresentToday(presentToday);
        
        // On break
        long onBreak = breakRepository.countActiveBreaks();
        stats.setOnBreak(onBreak);
        
        // Working now
        long workingNow = attendanceSessionRepository.countByStatusToday(
            AttendanceSession.AttendanceStatus.WORKING
        );
        stats.setWorkingNow(workingNow);
        
        // Late today
        long lateToday = attendanceSessionRepository.countByStatusToday(
            AttendanceSession.AttendanceStatus.LATE
        );
        stats.setLateToday(lateToday);
        
        // Absent
        stats.setAbsentToday(totalEmployees - presentToday);
        
        // Pending requests
        long pendingLeaves = leaveRepository.countPendingLeaves();
        long pendingCorrections = correctionRequestRepository.countPendingCorrections();
        stats.setPendingRequests(pendingLeaves + pendingCorrections);
        
        return stats;
    }
    

    @Transactional
    public void applyLeave(Long employeeId, LocalDate startDate, LocalDate endDate, 
                          String leaveType, String reason) {
        // Validate employee exists
        userRepository.findById(employeeId)
            .orElseThrow(() -> new RuntimeException("Employee not found with ID: " + employeeId));
        
        // Create attendance sessions for each day in the date range
        LocalDate currentDate = startDate;
        while (!currentDate.isAfter(endDate)) {
            // Check if session already exists for this date
            List<AttendanceSession> existingSessions = attendanceSessionRepository
                .findByEmployeeIdAndDate(employeeId, currentDate);
            
            if (existingSessions.isEmpty()) {
                // Create new session
                AttendanceSession session = new AttendanceSession();
                session.setEmployeeId(employeeId);
                session.setStartTime(currentDate.atStartOfDay());
                session.setEndTime(currentDate.atTime(23, 59, 59));
                session.setStatus(AttendanceSession.AttendanceStatus.LEAVE);
                session.setTotalSeconds(0);
                
                attendanceSessionRepository.save(session);
            }
            
            currentDate = currentDate.plusDays(1);
        }
        
        // Also create leave record
        Leave leave = new Leave();
        leave.setUserId(employeeId);
        leave.setLeaveType(leaveType);
        leave.setStartDate(startDate);
        leave.setEndDate(endDate);
        leave.setTotalDays((int) ChronoUnit.DAYS.between(startDate, endDate) + 1);
        leave.setReason(reason);
        leave.setStatus(Leave.LeaveStatus.APPROVED);
        
        leaveRepository.save(leave);
    }
    

    @Transactional
    public void applyLeaveAll(LocalDate startDate, LocalDate endDate, 
                             String leaveType, String reason) {
        List<User> employees = userRepository.findByRole(User.Role.EMPLOYEE);
        
        for (User employee : employees) {
            applyLeave(employee.getId(), startDate, endDate, leaveType, reason);
        }
    }
    

    @Transactional
    public void forcePunchIn(Long employeeId, LocalDateTime timestamp) {
        // Validate employee exists
        userRepository.findById(employeeId)
            .orElseThrow(() -> new RuntimeException("Employee not found with ID: " + employeeId));
        
        Optional<AttendanceSession> activeSession = attendanceSessionRepository
            .findActiveSessionByEmployeeId(employeeId);
        
        if (activeSession.isPresent()) {
            throw new RuntimeException("Active session already exists for employee");
        }
        
        AttendanceSession session = new AttendanceSession();
        session.setEmployeeId(employeeId);
        session.setStartTime(timestamp != null ? timestamp : LocalDateTime.now());
        session.setStatus(AttendanceSession.AttendanceStatus.WORKING);
        
        attendanceSessionRepository.save(session);
    }
    

    @Transactional
    public void forcePunchOut(Long employeeId, LocalDateTime timestamp) {
        // Validate employee exists
        userRepository.findById(employeeId)
            .orElseThrow(() -> new RuntimeException("Employee not found with ID: " + employeeId));
        
        AttendanceSession session = attendanceSessionRepository
            .findActiveSessionByEmployeeId(employeeId)
            .orElseThrow(() -> new RuntimeException("No active session found for employee"));
        
        LocalDateTime endTime = timestamp != null ? timestamp : LocalDateTime.now();
        session.setEndTime(endTime);
        session.setTotalSeconds((int) ChronoUnit.SECONDS.between(session.getStartTime(), endTime));
        session.setStatus(AttendanceSession.AttendanceStatus.COMPLETED);
        
        attendanceSessionRepository.save(session);
    }
    

    public List<Map<String, Object>> getLiveAttendance() {
        List<AttendanceSession> todaySessions = attendanceSessionRepository.findTodaysSessions();
        List<User> allEmployees = userRepository.findByRole(User.Role.EMPLOYEE);
        
        List<Map<String, Object>> liveData = new ArrayList<>();
        
        for (User employee : allEmployees) {
            Map<String, Object> employeeData = new HashMap<>();
            employeeData.put("employeeId", employee.getId());
            employeeData.put("employeeName", employee.getFullName());
            employeeData.put("email", employee.getEmail());
            
            // Find today's session for this employee
            Optional<AttendanceSession> sessionOpt = todaySessions.stream()
                .filter(s -> s.getEmployeeId().equals(employee.getId()))
                .findFirst();
            
            if (sessionOpt.isPresent()) {
                AttendanceSession session = sessionOpt.get();
                employeeData.put("status", session.getStatus().name());
                employeeData.put("startTime", session.getStartTime());
                employeeData.put("endTime", session.getEndTime());
                
                // Calculate work duration
                if (session.getTotalSeconds() != null) {
                    employeeData.put("workDuration", formatDuration(session.getTotalSeconds()));
                } else if (session.getStartTime() != null) {
                    int seconds = (int) ChronoUnit.SECONDS.between(session.getStartTime(), LocalDateTime.now());
                    employeeData.put("workDuration", formatDuration(seconds));
                }
                
                // Get break info
                List<Break> breaks = breakRepository.findBySessionId(session.getId());
                int totalBreakSeconds = breaks.stream()
                    .filter(b -> b.getDurationSeconds() != null)
                    .mapToInt(Break::getDurationSeconds)
                    .sum();
                employeeData.put("breakDuration", formatDuration(totalBreakSeconds));
            } else {
                employeeData.put("status", "ABSENT");
                employeeData.put("workDuration", "00:00:00");
                employeeData.put("breakDuration", "00:00:00");
            }
            
            liveData.add(employeeData);
        }
        
        return liveData;
    }
    

    public Map<String, Object> getReports(Integer month, Integer year) {
        LocalDate startDate;
        LocalDate endDate;
        
        if (month != null && year != null) {
            startDate = LocalDate.of(year, month, 1);
            endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());
        } else {
            startDate = LocalDate.now().withDayOfMonth(1);
            endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());
        }
        
        List<User> employees = userRepository.findByRole(User.Role.EMPLOYEE);
        List<Map<String, Object>> reports = new ArrayList<>();
        
        for (User employee : employees) {
            List<AttendanceSession> sessions = attendanceSessionRepository
                .findByEmployeeIdAndDateRange(employee.getId(), startDate, endDate);
            
            Map<String, Object> report = new HashMap<>();
            report.put("employeeId", employee.getId());
            report.put("employeeName", employee.getFullName());
            report.put("email", employee.getEmail());
            
            long presentDays = sessions.stream()
                .filter(s -> s.getStatus() == AttendanceSession.AttendanceStatus.PRESENT ||
                           s.getStatus() == AttendanceSession.AttendanceStatus.COMPLETED)
                .count();
            
            long absentDays = sessions.stream()
                .filter(s -> s.getStatus() == AttendanceSession.AttendanceStatus.ABSENT)
                .count();
            
            long lateDays = sessions.stream()
                .filter(s -> s.getStatus() == AttendanceSession.AttendanceStatus.LATE)
                .count();
            
            long leaveDays = sessions.stream()
                .filter(s -> s.getStatus() == AttendanceSession.AttendanceStatus.LEAVE)
                .count();
            
            int totalWorkSeconds = sessions.stream()
                .filter(s -> s.getTotalSeconds() != null)
                .mapToInt(AttendanceSession::getTotalSeconds)
                .sum();
            
            report.put("presentDays", presentDays);
            report.put("absentDays", absentDays);
            report.put("lateDays", lateDays);
            report.put("leaveDays", leaveDays);
            report.put("totalWorkHours", String.format("%.2f", totalWorkSeconds / 3600.0));
            
            reports.add(report);
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("month", month != null ? month : LocalDate.now().getMonthValue());
        result.put("year", year != null ? year : LocalDate.now().getYear());
        result.put("reports", reports);
        
        return result;
    }
    

    public List<Map<String, Object>> getTimesheets() {
        List<Timesheet> timesheets = timesheetRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();
        
        for (Timesheet timesheet : timesheets) {
            Map<String, Object> data = new HashMap<>();
            data.put("id", timesheet.getId());
            data.put("employeeId", timesheet.getEmployeeId());
            data.put("sessionId", timesheet.getSessionId());
            data.put("tasks", timesheet.getTasks());
            data.put("remarks", timesheet.getRemarks());
            data.put("submittedAt", timesheet.getSubmittedAt());
            
            // Get employee details
            userRepository.findById(timesheet.getEmployeeId()).ifPresent(user -> {
                data.put("employeeName", user.getFullName());
                data.put("email", user.getEmail());
            });
            
            result.add(data);
        }
        
        return result;
    }
    

    public Map<String, Object> getPendingRequests() {
        List<Leave> pendingLeaves = leaveRepository.findByStatus(Leave.LeaveStatus.PENDING);
        List<CorrectionRequest> pendingCorrections = correctionRequestRepository.findByStatus(CorrectionRequest.CorrectionStatus.PENDING);
        
        Map<String, Object> result = new HashMap<>();
        result.put("pendingLeaves", pendingLeaves);
        result.put("pendingCorrections", pendingCorrections);
        result.put("totalPending", pendingLeaves.size() + pendingCorrections.size());
        
        return result;
    }
    

    @Transactional
    public void approveRequest(Long id, String type) {
        if ("leave".equalsIgnoreCase(type)) {
            Leave leave = leaveRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Leave request not found"));
            leave.setStatus(Leave.LeaveStatus.APPROVED);
            leaveRepository.save(leave);
            
            // Create attendance sessions for approved leave
            applyLeave(leave.getUserId(), leave.getStartDate(), leave.getEndDate(), 
                      leave.getLeaveType(), leave.getReason());
        } else if ("correction".equalsIgnoreCase(type)) {
            CorrectionRequest correction = correctionRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Correction request not found"));
            correction.setStatus(CorrectionRequest.CorrectionStatus.APPROVED);
            correctionRequestRepository.save(correction);
            
            // Apply the correction
            List<AttendanceSession> sessions = attendanceSessionRepository
                .findByEmployeeIdAndDate(correction.getUserId(), correction.getDate());
            
            if (!sessions.isEmpty()) {
                AttendanceSession session = sessions.get(0);
                // Update session based on correction request
                // You can add more logic here based on your correction request structure
                attendanceSessionRepository.save(session);
            }
        } else {
            throw new RuntimeException("Invalid request type: " + type);
        }
    }
    

    @Transactional
    public void rejectRequest(Long id, String type, String reason) {
        if ("leave".equalsIgnoreCase(type)) {
            Leave leave = leaveRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Leave request not found"));
            leave.setStatus(Leave.LeaveStatus.REJECTED);
            leave.setReason(reason);
            leaveRepository.save(leave);
        } else if ("correction".equalsIgnoreCase(type)) {
            CorrectionRequest correction = correctionRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Correction request not found"));
            correction.setStatus(CorrectionRequest.CorrectionStatus.REJECTED);
            correction.setReason(reason);
            correctionRequestRepository.save(correction);
        } else {
            throw new RuntimeException("Invalid request type: " + type);
        }
    }
    

    public List<AttendanceSession> getRecords(Long userId, String date, String status, 
                                              String startDate, String endDate) {
        if (userId != null && startDate != null && endDate != null) {
            LocalDate start = LocalDate.parse(startDate);
            LocalDate end = LocalDate.parse(endDate);
            return attendanceSessionRepository.findByEmployeeIdAndDateRange(userId, start, end);
        } else if (userId != null && date != null) {
            LocalDate filterDate = LocalDate.parse(date);
            return attendanceSessionRepository.findByEmployeeIdAndDate(userId, filterDate);
        } else if (startDate != null && endDate != null) {
            // Get all sessions for date range
            LocalDate start = LocalDate.parse(startDate);
            LocalDate end = LocalDate.parse(endDate);
            List<User> employees = userRepository.findByRole(User.Role.EMPLOYEE);
            List<AttendanceSession> allSessions = new ArrayList<>();
            for (User employee : employees) {
                allSessions.addAll(attendanceSessionRepository.findByEmployeeIdAndDateRange(employee.getId(), start, end));
            }
            return allSessions;
        } else {
            return attendanceSessionRepository.findTodaysSessions();
        }
    }
    public Map<String, Object> getCalendar(Long userId, Integer year, Integer month) {
        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());
        
        List<AttendanceSession> sessions = attendanceSessionRepository
            .findByEmployeeIdAndDateRange(userId, startDate, endDate);
        
        Map<LocalDate, List<AttendanceSession>> sessionsByDate = sessions.stream()
            .collect(Collectors.groupingBy(session -> session.getStartTime().toLocalDate()));

        Map<LocalDate, Holiday> holidayByDate = new HashMap<>();
        userRepository.findById(userId).ifPresent(employee -> {
            if (employee.getTenantCode() != null && !employee.getTenantCode().isBlank() && employee.getCompanyId() != null) {
                holidayByDate.putAll(holidayService.getHolidayMapForMonth(
                        employee.getTenantCode(),
                        employee.getCompanyId(),
                        startDate,
                        endDate
                ));
            }
        });
        
        List<Map<String, Object>> days = new ArrayList<>();
        
        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            Map<String, Object> dayData = new HashMap<>();
            dayData.put("date", date.toString());
            
            List<AttendanceSession> daySessions = sessionsByDate.getOrDefault(date, new ArrayList<>());
            Holiday holiday = holidayByDate.get(date);
            boolean isWeekend = date.getDayOfWeek().getValue() == 6 || date.getDayOfWeek().getValue() == 7;
            boolean isHolidayDate = holiday != null || isWeekend;
            
            if (!daySessions.isEmpty()) {
                AttendanceSession session = daySessions.get(0);
                String status = session.getStatus().name();
                Integer totalSeconds = session.getTotalSeconds() != null ? session.getTotalSeconds() : 0;
                if (isHolidayDate && totalSeconds > 0) {
                    status = "HOLIDAY_WORK";
                }
                applyCalendarColors(dayData, status);
                dayData.put("startTime", session.getStartTime());
                dayData.put("endTime", session.getEndTime());
                
                if (session.getTotalSeconds() != null) {
                    dayData.put("workHours", String.format("%.2f", session.getTotalSeconds() / 3600.0));
                }
            } else {
                if (isHolidayDate) {
                    applyCalendarColors(dayData, "HOLIDAY");
                } else {
                    applyCalendarColors(dayData, "ABSENT");
                }
                dayData.put("workHours", "0.00");
            }

            if (holiday != null) {
                dayData.put("holidayName", holiday.getName());
                dayData.put("holidayType", holiday.getType());
            }
            
            days.add(dayData);
        }
        
        Map<String, Object> calendar = new HashMap<>();
        calendar.put("year", year);
        calendar.put("month", month);
        calendar.put("days", days);
        return calendar;
    }

public Map<String, Object> getAttendanceAnalytics() {
    List<AttendanceSession> todaySessions = attendanceSessionRepository.findTodaysSessions();
    long totalEmployees = userRepository.countByRole(User.Role.EMPLOYEE);
    
    Map<String, Object> analytics = new HashMap<>();
    
    long present = todaySessions.stream()
        .filter(s -> s.getStatus() != AttendanceSession.AttendanceStatus.ABSENT)
        .map(AttendanceSession::getEmployeeId)
        .distinct()
        .count();
    
    long absent = totalEmployees - present;
    
    long late = todaySessions.stream()
        .filter(s -> s.getStatus() == AttendanceSession.AttendanceStatus.LATE)
        .count();
    
    long onLeave = todaySessions.stream()
        .filter(s -> s.getStatus() == AttendanceSession.AttendanceStatus.LEAVE)
        .count();
    
    analytics.put("totalEmployees", totalEmployees);
    analytics.put("present", present);
    analytics.put("absent", absent);
    analytics.put("late", late);
    analytics.put("onLeave", onLeave);
    analytics.put("presentPercentage", totalEmployees > 0 ? (present * 100.0 / totalEmployees) : 0);
    
    return analytics;
}


private void applyCalendarColors(Map<String, Object> map, String status) {
    switch (status) {
        case "FULL":
        case "COMPLETED":
        case "PRESENT":
            setCalendarStatus(map, "FULL", "#16A34A", "#FFFFFF");
            break;
        case "HALF":
        case "HALF_DAY":
            setCalendarStatus(map, "HALF", "#F97316", "#FFFFFF");
            break;
        case "PARTIAL":
            setCalendarStatus(map, "PARTIAL", "#F59E0B", "#000000");
            break;
        case "WORKING":
            setCalendarStatus(map, "WORKING", "#0EA5E9", "#FFFFFF");
            break;
        case "ON_BREAK":
            setCalendarStatus(map, "ON_BREAK", "#06B6D4", "#FFFFFF");
            break;
        case "LEAVE":
            setCalendarStatus(map, "LEAVE", "#FACC15", "#000000");
            break;
        case "COMPENSATION_OFF":
            setCalendarStatus(map, "COMPENSATION_OFF", "#2563EB", "#FFFFFF");
            break;
        case "HOLIDAY_WORK":
            setCalendarStatus(map, "HOLIDAY_WORK", "#7C3AED", "#FFFFFF");
            break;
        case "HOLIDAY":
            setCalendarStatus(map, "HOLIDAY", "#374151", "#FFFFFF");
            break;
        default:
            setCalendarStatus(map, "ABSENT", "#DC2626", "#FFFFFF");
    }
}

private void setCalendarStatus(Map<String, Object> map, String status, String bg, String text) {
    map.put("status", status);
    map.put("displayText", status);
    map.put("statusColor", bg);
    map.put("textColor", text);
}


public List<Map<String, Object>> getUsers() {
    List<User> employees = userRepository.findByRole(User.Role.EMPLOYEE);
    List<Map<String, Object>> users = new ArrayList<>();
    
    for (User employee : employees) {
        Map<String, Object> userData = new HashMap<>();
        userData.put("id", employee.getId());
        userData.put("fullName", employee.getFullName());
        userData.put("email", employee.getEmail());
        userData.put("phone", employee.getPhone());
        userData.put("role", employee.getRole());
        
        users.add(userData);
    }
    
    return users;
}


@Transactional
public void applyBulkActionForUser(BulkActionRequest request) {
    // Validate employee exists
    userRepository.findById(request.getEmployeeId())
        .orElseThrow(() -> new RuntimeException("Employee not found with ID: " + request.getEmployeeId()));
    
    LocalDate startDate = request.getStartDate();
    LocalDate endDate = request.getEndDate();
    
    LocalDate currentDate = startDate;
    while (!currentDate.isAfter(endDate)) {
        // Check if session already exists
        List<AttendanceSession> existingSessions = attendanceSessionRepository
            .findByEmployeeIdAndDate(request.getEmployeeId(), currentDate);
        
        if (!existingSessions.isEmpty()) {
            // Update existing session
            AttendanceSession session = existingSessions.get(0);
            session.setStatus(AttendanceSession.AttendanceStatus.valueOf(request.getStatus()));
            attendanceSessionRepository.save(session);
        } else {
            // Create new session
            AttendanceSession session = new AttendanceSession();
            session.setEmployeeId(request.getEmployeeId());
            session.setStartTime(currentDate.atStartOfDay());
            session.setEndTime(currentDate.atTime(23, 59, 59));
            session.setStatus(AttendanceSession.AttendanceStatus.valueOf(request.getStatus()));
            session.setTotalSeconds(0);
            
            attendanceSessionRepository.save(session);
        }
        
        currentDate = currentDate.plusDays(1);
    }
}


@Transactional
public void applyManualAttendance(Long employeeId, ManualAttendanceRequest request) {
    // Validate employee exists
    userRepository.findById(employeeId)
        .orElseThrow(() -> new RuntimeException("Employee not found with ID: " + employeeId));
    
    // Validate dates
    if (request.getStartDate() == null || request.getEndDate() == null) {
        throw new RuntimeException("Start date and end date are required");
    }
    
    if (request.getStartDate().isAfter(request.getEndDate())) {
        throw new RuntimeException("Start date cannot be after end date");
    } 
    
    // Validate status
    try {
        AttendanceSession.AttendanceStatus.valueOf(request.getLeaveType());
    } catch (IllegalArgumentException e) {
        throw new RuntimeException("Invalid attendance status: " + request.getLeaveType());
    }
    
    // Create attendance sessions for each day in the date range
    LocalDate currentDate = request.getStartDate();
    while (!currentDate.isAfter(request.getEndDate())) {
        // Check if session already exists for this date
        List<AttendanceSession> existingSessions = attendanceSessionRepository
            .findByEmployeeIdAndDate(employeeId, currentDate);
        
        if (!existingSessions.isEmpty()) {
            throw new RuntimeException("Attendance already exists for date: " + currentDate + 
                ". Please use update API to modify existing attendance.");
        }
        
        // Create new attendance session
        AttendanceSession session = new AttendanceSession();
        session.setEmployeeId(employeeId); 
        session.setStartTime(currentDate.atStartOfDay());
        session.setEndTime(currentDate.atTime(23, 59, 59));
        session.setStatus(AttendanceSession.AttendanceStatus.valueOf(request.getLeaveType()));
        
        // Set total seconds based on status
        if (request.getLeaveType().equals("PRESENT") || 
            request.getLeaveType().equals("WORKING") ||
            request.getLeaveType().equals("COMPLETED")) {
            // Default 8 hours work day
            session.setTotalSeconds(8 * 60 * 60);
        } else if (request.getLeaveType().equals("HALF_DAY")) {
            // 4 hours for half day    
            session.setTotalSeconds(4 * 60 * 60);
        } else {
            // 0 for other statuses
            session.setTotalSeconds(0);
        }
        
        attendanceSessionRepository.save(session);
        
        currentDate = currentDate.plusDays(1);
    }
}


@Transactional
public void updateManualAttendance(Long employeeId, ManualAttendanceRequest request) {
    // Validate employee exists
    userRepository.findById(employeeId)
        .orElseThrow(() -> new RuntimeException("Employee not found with ID: " + employeeId));
    
    // Validate dates
    if (request.getStartDate() == null || request.getEndDate() == null) {
        throw new RuntimeException("Start date and end date are required");
    }
    
    if (request.getStartDate().isAfter(request.getEndDate())) {
        throw new RuntimeException("Start date cannot be after end date");
    }
    
    // Validate status
    try {
        AttendanceSession.AttendanceStatus.valueOf(request.getLeaveType());
    } catch (IllegalArgumentException e) {
        throw new RuntimeException("Invalid attendance status: " + request.getLeaveType());
    }
    
    // Update attendance sessions for each day in the date range
    LocalDate currentDate = request.getStartDate();
    while (!currentDate.isAfter(request.getEndDate())) {
        // Find existing session for this date
        List<AttendanceSession> existingSessions = attendanceSessionRepository
            .findByEmployeeIdAndDate(employeeId, currentDate);
        
        if (existingSessions.isEmpty()) {
            // Create new session if doesn't exist
            AttendanceSession session = new AttendanceSession();
            session.setEmployeeId(employeeId);
            session.setStartTime(currentDate.atStartOfDay());
            session.setEndTime(currentDate.atTime(23, 59, 59));
            session.setStatus(AttendanceSession.AttendanceStatus.valueOf(request.getLeaveType()));
            
            // Set total seconds based on status
            if (request.getLeaveType().equals("PRESENT") || 
                request.getLeaveType().equals("WORKING") ||
                request.getLeaveType().equals("COMPLETED")) {
                session.setTotalSeconds(8 * 60 * 60);
            } else if (request.getLeaveType().equals("HALF_DAY")) {
                session.setTotalSeconds(4 * 60 * 60);
            } else {
                session.setTotalSeconds(0);
            }
            
            attendanceSessionRepository.save(session);
        } else {
            // Update existing session
            AttendanceSession session = existingSessions.get(0);
            session.setStatus(AttendanceSession.AttendanceStatus.valueOf(request.getLeaveType()));
            
            // Update total seconds based on new status
            if (request.getLeaveType().equals("PRESENT") || 
                request.getLeaveType().equals("WORKING") ||
                request.getLeaveType().equals("COMPLETED")) {
                session.setTotalSeconds(8 * 60 * 60);
            } else if (request.getLeaveType().equals("HALF_DAY")) {
                session.setTotalSeconds(4 * 60 * 60);
            } else {
                session.setTotalSeconds(0);
            }
            
            attendanceSessionRepository.save(session);
        }
        
        currentDate = currentDate.plusDays(1);
    }
    
    
}


private String formatDuration(int seconds) {
    int hours = seconds / 3600;
    int minutes = (seconds % 3600) / 60;
    int secs = seconds % 60;
    return String.format("%02d:%02d:%02d", hours, minutes, secs);
}

public List<Map<String, Object>> getAllAdmins() {
    // ✅ Uses custom query - gets BOTH role=ADMIN AND isAdmin=true users
    List<User> admins = userRepository.findAllAdmins(User.Role.ADMIN);
    List<Map<String, Object>> adminList = new ArrayList<>();
    
    for (User admin : admins) {
        Map<String, Object> adminData = new HashMap<>();
        adminData.put("id", admin.getId());
        adminData.put("fullName", admin.getFullName());
        adminData.put("email", admin.getEmail());
        adminData.put("phone", admin.getPhone() != null ? admin.getPhone() : admin.getMobile());
        adminData.put("role", admin.getRole().name());
        adminData.put("department", admin.getDepartment());
        adminData.put("status", admin.getStatus().name());
        adminData.put("isActive", admin.getIsActive());           // ✅ Uses your method
        adminData.put("isAdmin", admin.getIsAdmin());             // ✅ Uses your method  
        adminData.put("adminRole", admin.getAdminRole());
        adminData.put("lastLoginAt", admin.getLastLoginAt());
        adminData.put("isVerified", admin.getIsVerified());
        adminData.put("onboardingStatus", admin.getOnboardingStatus().name());
        
        adminList.add(adminData);
    }
    
    return adminList;
}

//✅ ADD THESE METHODS to your AdminAttendanceService

	@Transactional
	public void deleteAdmin(Long id) {
	 User admin = userRepository.findById(id)
	     .filter(this::isAdminUser)  // Only admins can be deleted
	     .orElseThrow(() -> new RuntimeException("Admin not found with ID: " + id));
	 
	 // Soft delete
	 admin.setStatus(User.Status.INACTIVE);
	 admin.setDeletedAt(LocalDateTime.now());
	 userRepository.save(admin);
	}
	
	@Transactional
	public void updateAdmin(Long id, String fullName, String email, String phone, 
	                    String department, String position, Boolean isAdmin) {
	 User admin = userRepository.findById(id)
	     .filter(this::isAdminUser)
	     .orElseThrow(() -> new RuntimeException("Admin not found with ID: " + id));
	 
	 if (fullName != null) admin.setFullName(fullName);
	 if (email != null) admin.setEmail(email);
	 if (phone != null) admin.setPhone(phone);
	 if (department != null) admin.setDepartment(department);
	 if (position != null) admin.setPosition(position);
	 if (isAdmin != null) admin.setIsAdmin(isAdmin);
	 
	 userRepository.save(admin);
	}
	
	public Map<String, Object> getAdminById(Long id) {
	 User admin = userRepository.findById(id)
	     .filter(this::isAdminUser)
	     .orElseThrow(() -> new RuntimeException("Admin not found with ID: " + id));
	 
	 Map<String, Object> adminData = new HashMap<>();
	 adminData.put("id", admin.getId());
	 adminData.put("fullName", admin.getFullName());
	 adminData.put("email", admin.getEmail());
	 adminData.put("phone", admin.getPhone());
	 adminData.put("department", admin.getDepartment());
	 adminData.put("position", admin.getPosition());
	 adminData.put("isAdmin", admin.getIsAdmin());
	 adminData.put("status", admin.getStatus().name());
	 return adminData;
	}
	
	//✅ Helper method
	private boolean isAdminUser(User user) {
	 return User.Role.ADMIN.equals(user.getRole()) || Boolean.TRUE.equals(user.getIsAdmin());
	}
	
    
    public List<Timesheet> getAllTimesheets() {
        return timesheetRepository.findAll();
    }
    
    public Timesheet getTimesheetById(Long id) {
        return timesheetRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Timesheet not found with id: " + id));
    }
    
    public Timesheet updateTimesheet(Long id, String task, String remarks) {
        Timesheet timesheet = getTimesheetById(id);
        if (task != null) timesheet.setTasks(task);
        if (remarks != null) timesheet.setRemarks(remarks);
        return timesheetRepository.save(timesheet);
    }
    
    public void deleteTimesheet(Long id) {
        timesheetRepository.deleteById(id);
    }
    
    public Optional<Timesheet> getTimesheetsByEmployee(Long employeeId) {
        return timesheetRepository.findById(employeeId);
    }
    public DashboardStatsResponse getDashboardStats(String tenantCode, Long companyId) {
        DashboardStatsResponse stats = new DashboardStatsResponse();

        long totalEmployees = userRepository.countEmployeesByTenantCompany(tenantCode, companyId);
        stats.setTotalEmployees(totalEmployees);

        long presentToday = attendanceSessionRepository.countPresentTodayByTenantCompany(tenantCode, companyId);
        stats.setPresentToday(presentToday);

        long onBreak = breakRepository.countActiveBreaksByTenantCompany(tenantCode, companyId);
        stats.setOnBreak(onBreak);

        long workingNow = attendanceSessionRepository.countByStatusTodayByTenantCompany(
                AttendanceSession.AttendanceStatus.WORKING, tenantCode, companyId
        );
        stats.setWorkingNow(workingNow);

        long lateToday = attendanceSessionRepository.countByStatusTodayByTenantCompany(
                AttendanceSession.AttendanceStatus.LATE, tenantCode, companyId
        );
        stats.setLateToday(lateToday);

        stats.setAbsentToday(Math.max(0, totalEmployees - presentToday));

        long pendingLeaves = leaveRepository.countPendingLeaves(); // optional filter later
        long pendingCorrections = correctionRequestRepository.countPendingCorrections(); // optional filter later
        stats.setPendingRequests(pendingLeaves + pendingCorrections);

        return stats;
    }
    public List<Map<String, Object>> getLiveAttendance(String tenantCode, Long companyId) {

        List<AttendanceSession> todaySessions =
                attendanceSessionRepository.findTodaysSessionsByTenantCompany(tenantCode, companyId);

        List<User> employees =
                userRepository.findEmployeesByTenantCompany(tenantCode, companyId);

        List<Map<String, Object>> liveData = new ArrayList<>();

        for (User employee : employees) {
            Map<String, Object> employeeData = new HashMap<>();
            employeeData.put("employeeId", employee.getId());
            employeeData.put("employeeName", employee.getFullName());
            employeeData.put("email", employee.getEmail());
            employeeData.put("department", employee.getDepartment());
            employeeData.put("companyId", employee.getCompanyId());
            employeeData.put("tenantCode", employee.getTenantCode());

            Optional<AttendanceSession> sessionOpt = todaySessions.stream()
                    .filter(s -> s.getEmployeeId().equals(employee.getId()))
                    .findFirst();

            if (sessionOpt.isPresent()) {
                AttendanceSession session = sessionOpt.get();
                employeeData.put("status", session.getStatus().name());
                employeeData.put("startTime", session.getStartTime());
                employeeData.put("endTime", session.getEndTime());

                int seconds = session.getTotalSeconds() != null
                        ? session.getTotalSeconds()
                        : (session.getStartTime() != null
                            ? (int) ChronoUnit.SECONDS.between(session.getStartTime(), LocalDateTime.now())
                            : 0);

                employeeData.put("workDuration", formatDuration(seconds));

                List<Break> breaks = breakRepository.findBySessionId(session.getId());
                int totalBreakSeconds = breaks.stream()
                        .filter(b -> b.getDurationSeconds() != null)
                        .mapToInt(Break::getDurationSeconds)
                        .sum();

                employeeData.put("breakDuration", formatDuration(totalBreakSeconds));
            } else {
                employeeData.put("status", "ABSENT");
                employeeData.put("workDuration", "00:00:00");
                employeeData.put("breakDuration", "00:00:00");
            }

            liveData.add(employeeData);
        }

        return liveData;
    }
    
    public List<Map<String, Object>> getTimesheets(String tenantCode, Long companyId) {
        List<Timesheet> timesheets = timesheetRepository.findAllByTenantCompany(tenantCode, companyId);

        List<Map<String, Object>> result = new ArrayList<>();

        for (Timesheet timesheet : timesheets) {
            Map<String, Object> data = new HashMap<>();
            data.put("id", timesheet.getId());
            data.put("employeeId", timesheet.getEmployeeId());
            data.put("sessionId", timesheet.getSessionId());
            data.put("tasks", timesheet.getTasks());
            data.put("remarks", timesheet.getRemarks());
            data.put("submittedAt", timesheet.getSubmittedAt());

            userRepository.findById(timesheet.getEmployeeId()).ifPresent(user -> {
                data.put("employeeName", user.getFullName());
                data.put("email", user.getEmail());
            });

            result.add(data);
        }

        return result;
    }




}
