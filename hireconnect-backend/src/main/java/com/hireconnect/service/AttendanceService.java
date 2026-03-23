package com.hireconnect.service;

import java.time.DayOfWeek;
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
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hireconnect.dto.request.AttendanceRequest;
import com.hireconnect.dto.request.LeaveRequest;
import com.hireconnect.dto.request.TimesheetRequest;
import com.hireconnect.dto.response.AttendanceResponse;
import com.hireconnect.entity.AttendanceSession;
import com.hireconnect.entity.Break;
import com.hireconnect.entity.Holiday;
import com.hireconnect.entity.Leave;
import com.hireconnect.entity.Timesheet;
import com.hireconnect.repository.AttendanceSessionRepository;
import com.hireconnect.repository.BreakRepository;
import com.hireconnect.repository.LeaveRepository;
import com.hireconnect.repository.TimesheetRepository;
import com.hireconnect.repository.UserRepository;

@Service
public class AttendanceService {
    
    @Autowired
    private AttendanceSessionRepository attendanceSessionRepository;
    
    @Autowired
    private BreakRepository breakRepository;
    
    @Autowired
    private TimesheetRepository timesheetRepository;
    
    @Autowired
    private LeaveRepository leaveRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private HolidayService holidayService;
    
    private static final int MAX_WORK_SECONDS = 9 * 60 * 60;
    private static final int HALF_DAY_THRESHOLD_SECONDS = 4 * 60 * 60;
    private static final int HALF_DAY_CREDIT_SECONDS = 5 * 60 * 60;
    private static final int FULL_DAY_CREDIT_SECONDS = 8 * 60 * 60;

    public static class BiometricActivationResult {
        private final boolean attendanceActivated;
        private final boolean duplicate;
        private final String message;

        public BiometricActivationResult(boolean attendanceActivated, boolean duplicate, String message) {
            this.attendanceActivated = attendanceActivated;
            this.duplicate = duplicate;
            this.message = message;
        }

        public boolean isAttendanceActivated() {
            return attendanceActivated;
        }

        public boolean isDuplicate() {
            return duplicate;
        }

        public String getMessage() {
            return message;
        }
    }

    @Transactional
    public AttendanceSession startWork(Long employeeId) {
        LocalDate today = LocalDate.now();
        
        List<AttendanceSession> todaySessions = attendanceSessionRepository
            .findByEmployeeIdAndDate(employeeId, today);
        
        if (!todaySessions.isEmpty()) {
            AttendanceSession existingSession = todaySessions.get(0);
            if (existingSession.getStatus() == AttendanceSession.AttendanceStatus.COMPLETED ||
                existingSession.getStatus() == AttendanceSession.AttendanceStatus.HALF_DAY ||
                existingSession.getStatus() == AttendanceSession.AttendanceStatus.PRESENT) {
                throw new RuntimeException("Work already ended for today. You can start work again tomorrow.");
            }
            throw new RuntimeException("Work session already started today at " + 
                existingSession.getStartTime().toLocalTime());
        }
        
        AttendanceSession session = new AttendanceSession();
        session.setEmployeeId(employeeId);
        session.setStartTime(LocalDateTime.now());
        session.setStatus(AttendanceSession.AttendanceStatus.WORKING);
        session.setInternalWorkSeconds(0);
        session.setTotalSeconds(0);
        session.setSource("manual");
        
        return attendanceSessionRepository.save(session);
    }

    @Transactional
    public BiometricActivationResult activateBiometricAttendance(
            Long employeeId,
            String source,
            int duplicateWindowMinutes
    ) {
        LocalDate today = LocalDate.now();
        LocalDateTime now = LocalDateTime.now();
        List<AttendanceSession> todaySessions = attendanceSessionRepository
            .findByEmployeeIdAndDate(employeeId, today);

        if (!todaySessions.isEmpty()) {
            AttendanceSession existing = todaySessions.get(0);
            boolean withinDuplicateWindow = existing.getStartTime() != null &&
                Math.abs(ChronoUnit.MINUTES.between(existing.getStartTime(), now)) <= duplicateWindowMinutes;
            String duplicateMessage = withinDuplicateWindow
                ? "Attendance already marked in the duplicate protection window."
                : "Attendance already marked for today.";
            return new BiometricActivationResult(false, true, duplicateMessage);
        }

        AttendanceSession session = new AttendanceSession();
        session.setEmployeeId(employeeId);
        session.setStartTime(now);
        session.setStatus(AttendanceSession.AttendanceStatus.WORKING);
        session.setInternalWorkSeconds(0);
        session.setTotalSeconds(0);
        session.setSource(source);
        attendanceSessionRepository.save(session);

        return new BiometricActivationResult(
            true,
            false,
            "Attendance check-in created from biometric verification."
        );
    }

    @Transactional
    public void startBreak(Long employeeId) {
        AttendanceSession session = getActiveTodaySession(employeeId);
        
        if (session.getStatus() == AttendanceSession.AttendanceStatus.ON_BREAK) {
            throw new RuntimeException("You are already on break");
        }
        
        if (session.getStatus() == AttendanceSession.AttendanceStatus.COMPLETED ||
            session.getStatus() == AttendanceSession.AttendanceStatus.PRESENT ||
            session.getStatus() == AttendanceSession.AttendanceStatus.HALF_DAY) {
            throw new RuntimeException("Cannot start break after work has ended");
        }
        
        // ✅ FIX: Check before starting break
        checkAndAutoSubmitIfExceeded(session);
        
        Break breakEntry = new Break();
        breakEntry.setSessionId(session.getId());
        breakEntry.setBreakStart(LocalDateTime.now());
        
        breakRepository.save(breakEntry);
        session.setStatus(AttendanceSession.AttendanceStatus.ON_BREAK);
        attendanceSessionRepository.save(session);
    }

    @Transactional
    public void resumeWork(Long employeeId) {
        AttendanceSession session = getActiveTodaySession(employeeId);
        
        Break breakEntry = breakRepository
            .findActiveBreakBySessionId(session.getId())
            .orElseThrow(() -> new RuntimeException("No active break found"));
        
        LocalDateTime now = LocalDateTime.now();
        breakEntry.setBreakEnd(now);
        breakEntry.setDurationSeconds((int) ChronoUnit.SECONDS.between(breakEntry.getBreakStart(), now));
        breakRepository.save(breakEntry);
        
        session.setStatus(AttendanceSession.AttendanceStatus.WORKING);
        attendanceSessionRepository.save(session);
        
        // ✅ FIX: Check after resuming work
        checkAndAutoSubmitIfExceeded(session);
    }

    @Transactional
    public AttendanceSession endWork(Long employeeId) {
        AttendanceSession session = getActiveTodaySession(employeeId);

        Optional<Break> activeBreak = breakRepository.findActiveBreakBySessionId(session.getId());
        if (activeBreak.isPresent()) {
            Break breakEntry = activeBreak.get();
            LocalDateTime now = LocalDateTime.now();
            breakEntry.setBreakEnd(now);
            breakEntry.setDurationSeconds(
                (int) ChronoUnit.SECONDS.between(breakEntry.getBreakStart(), now)
            );
            breakRepository.save(breakEntry);
        }

        LocalDateTime now = LocalDateTime.now();
        session.setEndTime(now);

        int totalElapsedSeconds = (int) ChronoUnit.SECONDS.between(session.getStartTime(), now);
        session.setTotalSeconds(totalElapsedSeconds);

        int netWorkSeconds = calculateNetWorkSeconds(session);
        int creditSeconds = calculateInternalWorkHours(netWorkSeconds);

        session.setInternalWorkSeconds(creditSeconds);

        if (creditSeconds >= FULL_DAY_CREDIT_SECONDS) {
            session.setStatus(AttendanceSession.AttendanceStatus.PRESENT);
        } else if (creditSeconds >= HALF_DAY_CREDIT_SECONDS) {
            session.setStatus(AttendanceSession.AttendanceStatus.HALF_DAY);
        } else {
            session.setStatus(AttendanceSession.AttendanceStatus.PARTIAL);
        }

        AttendanceSession savedSession = attendanceSessionRepository.save(session);

        if (netWorkSeconds >= MAX_WORK_SECONDS) {
            autoSubmitTimesheet(
                savedSession,
                "Auto-submitted: Work duration exceeded 9 hours"
            );
        }

        return savedSession;
    }

    private int calculateInternalWorkHours(int netWorkSeconds) {
        if (netWorkSeconds < HALF_DAY_THRESHOLD_SECONDS) {
            return HALF_DAY_CREDIT_SECONDS;
        } else if (netWorkSeconds >= HALF_DAY_THRESHOLD_SECONDS && netWorkSeconds <= MAX_WORK_SECONDS) {
            return FULL_DAY_CREDIT_SECONDS;
        }
        return MAX_WORK_SECONDS;
    }

    @Transactional
    public void checkAndAutoSubmitIfExceeded(AttendanceSession session) {
        if (session.getStatus() == AttendanceSession.AttendanceStatus.COMPLETED ||
            session.getStatus() == AttendanceSession.AttendanceStatus.PRESENT ||
            session.getStatus() == AttendanceSession.AttendanceStatus.HALF_DAY) {
            return;
        }
        
        int totalWorkSeconds = calculateNetWorkSeconds(session);
        if (totalWorkSeconds >= MAX_WORK_SECONDS) {
            LocalDateTime now = LocalDateTime.now();
            session.setEndTime(now);
            session.setTotalSeconds((int) ChronoUnit.SECONDS.between(session.getStartTime(), now));
            
            int internalWorkSeconds = calculateInternalWorkHours(totalWorkSeconds);
            session.setInternalWorkSeconds(internalWorkSeconds);
            session.setStatus(AttendanceSession.AttendanceStatus.PRESENT);
            
            attendanceSessionRepository.save(session);
            autoSubmitTimesheet(session, "Auto-submitted: Work duration exceeded 9 hours");
            
            // ✅ FIX: Throw exception to notify frontend
            throw new RuntimeException("Work session automatically ended after 9 hours. Timesheet submitted.");
        }
    }

    private int calculateNetWorkSeconds(AttendanceSession session) {
        LocalDateTime endTime = session.getEndTime() != null ? session.getEndTime() : LocalDateTime.now();
        int totalSeconds = (int) ChronoUnit.SECONDS.between(session.getStartTime(), endTime);
        
        int totalBreakSeconds = breakRepository.findBySessionId(session.getId())
            .stream()
            .mapToInt(b -> {
                if (b.getBreakEnd() != null) {
                    return b.getDurationSeconds();
                } else {
                    return (int) ChronoUnit.SECONDS.between(b.getBreakStart(), LocalDateTime.now());
                }
            })
            .sum();
        
        return totalSeconds - totalBreakSeconds;
    }

    private void autoSubmitTimesheet(AttendanceSession session, String remarks) {
        Optional<Timesheet> existingTimesheet = timesheetRepository.findBySessionId(session.getId());
        if (existingTimesheet.isPresent()) return;
        
        Timesheet timesheet = new Timesheet();
        timesheet.setSessionId(session.getId());
        timesheet.setEmployeeId(session.getEmployeeId());
        timesheet.setTasks("Auto-generated: Work completed");
        timesheet.setRemarks(remarks);
        timesheet.setSubmittedAt(LocalDateTime.now());
        timesheetRepository.save(timesheet);
    }

    private AttendanceSession getActiveTodaySession(Long employeeId) {
        LocalDate today = LocalDate.now();
        List<AttendanceSession> todaySessions = attendanceSessionRepository
            .findByEmployeeIdAndDate(employeeId, today);
        
        if (todaySessions.isEmpty()) {
            throw new RuntimeException("No active session found for today. Please start work first.");
        }
        
        AttendanceSession session = todaySessions.get(0);
        if (session.getStatus() == AttendanceSession.AttendanceStatus.COMPLETED ||
            session.getStatus() == AttendanceSession.AttendanceStatus.PRESENT ||
            session.getStatus() == AttendanceSession.AttendanceStatus.HALF_DAY) {
            throw new RuntimeException("Work already ended for today. You can start work again tomorrow.");
        }
        
        return session;
    }

    @Transactional
    public void saveTimesheet(TimesheetRequest request) {
        Long sessionId = request.getSessionId();
        Long employeeId = request.getEmployeeId();
        
        if (sessionId == null && employeeId != null) {
            LocalDate today = LocalDate.now();
            List<AttendanceSession> sessions = attendanceSessionRepository
                .findByEmployeeIdAndDate(employeeId, today);
            
            if (sessions.isEmpty()) {
                throw new RuntimeException("No attendance session found for today");
            }
            sessionId = sessions.get(0).getId();
        }
        
        if (sessionId == null) {
            throw new RuntimeException("Unable to determine session for timesheet");
        }
        
        Optional<Timesheet> existingTimesheet = timesheetRepository.findBySessionId(sessionId);
        if (existingTimesheet.isPresent()) {
            throw new RuntimeException("Timesheet already submitted for this session");
        }
        
        Timesheet timesheet = new Timesheet();
        timesheet.setSessionId(sessionId);
        timesheet.setEmployeeId(employeeId);
        timesheet.setTasks(request.getTasks());
        timesheet.setRemarks(request.getRemarks());
        timesheet.setSubmittedAt(LocalDateTime.now());
        timesheetRepository.save(timesheet);
    }

    public AttendanceResponse getTodayAttendance(Long employeeId) {
        LocalDate today = LocalDate.now();
        List<AttendanceSession> todaySessions = attendanceSessionRepository
            .findByEmployeeIdAndDate(employeeId, today);
        
        if (todaySessions.isEmpty()) {
            AttendanceResponse response = new AttendanceResponse();
            response.setStatus("not_started");
            response.setMessage("No work session started today");
            return response;
        }
        
        AttendanceSession session = todaySessions.get(0);
        AttendanceResponse response = new AttendanceResponse();
        response.setId(session.getId());
        response.setStartTime(session.getStartTime());
        response.setEndTime(session.getEndTime());
        
        String statusString = session.getStatus().name().toLowerCase();
        if (statusString.equals("present")) {
            statusString = "completed";
        }
        response.setStatus(statusString);
        
        int totalSeconds = session.getTotalSeconds() != null ? session.getTotalSeconds() : 0;
        if (session.getStatus() == AttendanceSession.AttendanceStatus.WORKING || 
            session.getStatus() == AttendanceSession.AttendanceStatus.ON_BREAK) {
            totalSeconds = (int) ChronoUnit.SECONDS.between(session.getStartTime(), LocalDateTime.now());
        }
        response.setTotalSeconds(totalSeconds);
        
        int totalBreakSeconds = breakRepository.findBySessionId(session.getId())
            .stream()
            .mapToInt(b -> {
                if (b.getBreakEnd() != null) {
                    return b.getDurationSeconds();
                } else {
                    response.setCurrentBreakStart(b.getBreakStart());
                    return (int) ChronoUnit.SECONDS.between(b.getBreakStart(), LocalDateTime.now());
                }
            })
            .sum();
        response.setTotalBreakSeconds(totalBreakSeconds);
        
        int netWorkSeconds = totalSeconds - totalBreakSeconds;
        response.setNetWorkSeconds(netWorkSeconds);
        
        if (session.getStartTime() != null) {
            response.setShiftStartTime(session.getStartTime().toLocalTime().toString());
        }
        if (session.getEndTime() != null) {
            response.setShiftEndTime(session.getEndTime().toLocalTime().toString());
        }
        
        Optional<Timesheet> timesheet = timesheetRepository.findBySessionId(session.getId());
        response.setTimesheetSubmitted(timesheet.isPresent());
        
        return response;
    }

    public Map<String, Object> getCalendarData(Long employeeId, Integer year, Integer month) {
        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());

        List<AttendanceSession> sessions = attendanceSessionRepository.findByEmployeeIdAndDateRange(
            employeeId, startDate, endDate
        );

        List<Leave> approvedLeaves = leaveRepository.findApprovedLeavesByUserIdAndDateRange(
            employeeId, startDate, endDate
        );

        Map<LocalDate, AttendanceSession> sessionByDate = sessions.stream()
            .filter(s -> s.getStartTime() != null)
            .collect(Collectors.toMap(
                s -> s.getStartTime().toLocalDate(),
                s -> s,
                (s1, s2) -> s1
            ));

        Map<LocalDate, Holiday> holidayByDate = new HashMap<>();
        userRepository.findById(employeeId).ifPresent(employee -> {
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
            final LocalDate currentDate = date;

            Map<String, Object> dayData = new HashMap<>();
            dayData.put("date", currentDate.toString());
            dayData.put("day", currentDate.getDayOfMonth());
            dayData.put("dayOfWeek", currentDate.getDayOfWeek().toString());

            boolean isWeekend = currentDate.getDayOfWeek() == DayOfWeek.SATURDAY ||
                               currentDate.getDayOfWeek() == DayOfWeek.SUNDAY;
            boolean isConfiguredHoliday = holidayByDate.containsKey(currentDate);
            Holiday configuredHoliday = holidayByDate.get(currentDate);

            boolean isOnLeave = approvedLeaves.stream().anyMatch(leave ->
                !currentDate.isBefore(leave.getStartDate()) &&
                !currentDate.isAfter(leave.getEndDate())
            );

            if (isOnLeave) {
                applyCalendarColors(dayData, "LEAVE");
                days.add(dayData);
                continue;
            }

            AttendanceSession session = sessionByDate.get(currentDate);

            if (session != null) {
                int internalSeconds = session.getInternalWorkSeconds() != null 
                    ? session.getInternalWorkSeconds() 
                    : 0;
                
                double hours = internalSeconds / 3600.0;

                dayData.put("startTime", session.getStartTime());
                dayData.put("endTime", session.getEndTime());
                dayData.put("internalWorkHours", hours);

                AttendanceSession.AttendanceStatus rawStatus = session.getStatus();

                if (rawStatus == AttendanceSession.AttendanceStatus.COMPENSATION_OFF) {
                    applyCalendarColors(dayData, "COMPENSATION_OFF");
                }
                else if (rawStatus == AttendanceSession.AttendanceStatus.HOLIDAY) {
                    applyCalendarColors(dayData, "HOLIDAY");
                }
                else if (rawStatus == AttendanceSession.AttendanceStatus.WORKING) {
                    applyCalendarColors(dayData, "WORKING");
                }
                else if (rawStatus == AttendanceSession.AttendanceStatus.ON_BREAK) {
                    applyCalendarColors(dayData, "ON_BREAK");
                }
                else if (rawStatus == AttendanceSession.AttendanceStatus.COMPLETED ||
                         rawStatus == AttendanceSession.AttendanceStatus.PRESENT) {
                    applyCalendarColors(dayData, "FULL");
                }
                else if (rawStatus == AttendanceSession.AttendanceStatus.HALF_DAY) {
                    applyCalendarColors(dayData, "HALF");
                }
                else if (hours >= 8) {
                    applyCalendarColors(dayData, "FULL");
                }
                else if (hours >= 5) {
                    applyCalendarColors(dayData, "HALF");
                }
                else if (hours > 0) {
                    applyCalendarColors(dayData, "PARTIAL");
                }
                else {
                    applyCalendarColors(dayData, "ABSENT");
                }

                if ((isWeekend || isConfiguredHoliday) && hours > 0) {
                    applyCalendarColors(dayData, "HOLIDAY_WORK");
                }
            }
            else {
                if (isWeekend || isConfiguredHoliday) {
                    applyCalendarColors(dayData, "HOLIDAY");
                }
                else if (currentDate.isAfter(LocalDate.now())) {
                    applyCalendarColors(dayData, "UPCOMING");
                }
                else {
                    applyCalendarColors(dayData, "ABSENT");
                }
            }

            if (configuredHoliday != null) {
                dayData.put("holidayName", configuredHoliday.getName());
                dayData.put("holidayType", configuredHoliday.getType());
            }
            days.add(dayData);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("year", year);
        response.put("month", month);
        response.put("monthName", startDate.getMonth().toString());
        response.put("days", days);

        return response;
    }

    public List<Holiday> getEmployeeHolidays(Long employeeId, Integer year, Integer month) {
        var employee = userRepository.findById(employeeId)
            .orElseThrow(() -> new RuntimeException("Employee not found"));

        if (employee.getTenantCode() == null || employee.getTenantCode().isBlank() || employee.getCompanyId() == null) {
            return new ArrayList<>();
        }

        if (year != null && month != null) {
            LocalDate startDate = LocalDate.of(year, month, 1);
            LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());
            return holidayService.getHolidaysForRange(
                employee.getTenantCode(),
                employee.getCompanyId(),
                startDate,
                endDate
            );
        }

        return holidayService.getHolidays(employee.getTenantCode(), employee.getCompanyId());
    }

    private void applyCalendarColors(Map<String, Object> map, String status) {
        switch (status) {
            case "FULL":
                set(map, "FULL", "#16A34A", "#FFFFFF");
                break;
            case "HALF":
                set(map, "HALF", "#F97316", "#FFFFFF");
                break;
            case "PARTIAL":
                set(map, "PARTIAL", "#F59E0B", "#000000");
                break;
            case "WORKING":
                set(map, "WORKING", "#0EA5E9", "#FFFFFF");
                break;
            case "ON_BREAK":
                set(map, "ON_BREAK", "#06B6D4", "#FFFFFF");
                break;
            case "LEAVE":
                set(map, "LEAVE", "#FACC15", "#000000");
                break;
            case "COMPENSATION_OFF":
                set(map, "COMPENSATION_OFF", "#2563EB", "#FFFFFF");
                break;
            case "HOLIDAY_WORK":
                set(map, "HOLIDAY_WORK", "#7C3AED", "#FFFFFF");
                break;
            case "HOLIDAY":
                set(map, "HOLIDAY", "#374151", "#FFFFFF");
                break;
            case "UPCOMING":
                set(map, "UPCOMING", "#E5E7EB", "#6B7280");
                break;
            default:
                set(map, "ABSENT", "#DC2626", "#FFFFFF");
        }
    }

    private void set(Map<String, Object> map, String status, String bg, String text) {
        map.put("status", status);
        map.put("displayText", status);
        map.put("statusColor", bg);
        map.put("textColor", text);
    }

    @Scheduled(cron = "0 * * * * *") // ✅ FIX: Run every minute instead of every hour
    @Transactional
    public void autoSubmitExceededSessions() {
        List<AttendanceSession> activeSessions = attendanceSessionRepository
            .findActiveSessionsExceedingDuration(MAX_WORK_SECONDS);
        
        for (AttendanceSession session : activeSessions) {
            try {
                checkAndAutoSubmitIfExceeded(session);
            } catch (Exception e) {
                System.err.println("Error auto-submitting session " + session.getId() + ": " + e.getMessage());
            }
        }
    }

    public Map<String, Object> getMonthlyAttendance(Long employeeId, Integer year, Integer month) {
        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());
        
        List<AttendanceSession> sessions = attendanceSessionRepository
            .findByEmployeeIdAndDateRange(employeeId, startDate, endDate);
        
        Map<String, Object> monthlyData = new HashMap<>();
        
        long presentDays = sessions.stream()
            .filter(s -> s.getStatus() == AttendanceSession.AttendanceStatus.COMPLETED ||
                        s.getStatus() == AttendanceSession.AttendanceStatus.PRESENT ||
                        s.getStatus() == AttendanceSession.AttendanceStatus.WORKING)
            .map(s -> s.getStartTime().toLocalDate())
            .distinct()
            .count();
        
        long halfDays = sessions.stream()
            .filter(s -> s.getStatus() == AttendanceSession.AttendanceStatus.HALF_DAY)
            .count();
        
        long leaves = sessions.stream()
            .filter(s -> s.getStatus() == AttendanceSession.AttendanceStatus.LEAVE)
            .count();
        
        int totalWorkSeconds = sessions.stream()
            .filter(s -> s.getTotalSeconds() != null)
            .mapToInt(AttendanceSession::getTotalSeconds)
            .sum();
        
        double totalWorkHours = totalWorkSeconds / 3600.0;
        double avgWorkHours = presentDays > 0 ? totalWorkHours / presentDays : 0;
        
        monthlyData.put("year", year);
        monthlyData.put("month", month);
        monthlyData.put("totalDays", startDate.lengthOfMonth());
        monthlyData.put("presentDays", presentDays);
        monthlyData.put("halfDays", halfDays);
        monthlyData.put("leaves", leaves);
        monthlyData.put("totalWorkHours", String.format("%.2f", totalWorkHours));
        monthlyData.put("avgWorkHours", String.format("%.2f", avgWorkHours));
        
        return monthlyData;
    }

    public Map<String, Object> getAttendanceSummary(Long employeeId) {
        LocalDate now = LocalDate.now();
        LocalDate startDate = now.withDayOfMonth(1);
        LocalDate endDate = now.withDayOfMonth(now.lengthOfMonth());
        
        List<AttendanceSession> sessions = attendanceSessionRepository
            .findByEmployeeIdAndDateRange(employeeId, startDate, endDate);
        
        Map<String, Object> summary = new HashMap<>();
        
        long fullDays = sessions.stream()
            .filter(s -> s.getInternalWorkSeconds() != null && s.getInternalWorkSeconds() >= FULL_DAY_CREDIT_SECONDS)
            .map(s -> s.getStartTime().toLocalDate())
            .distinct().count();
            
        long halfDays = sessions.stream()
            .filter(s -> s.getInternalWorkSeconds() != null && 
                         s.getInternalWorkSeconds() >= HALF_DAY_CREDIT_SECONDS && 
                         s.getInternalWorkSeconds() < FULL_DAY_CREDIT_SECONDS)
            .map(s -> s.getStartTime().toLocalDate())
            .distinct().count();
        
        AttendanceResponse todayAttendance = getTodayAttendance(employeeId);
        
        summary.put("currentMonth", now.getMonth().toString());
        summary.put("fullDays", fullDays);
        summary.put("halfDays", halfDays);
        summary.put("todayAttendance", todayAttendance);
        
        return summary;
    }

    @Transactional
    public Leave submitLeaveRequest(LeaveRequest request) {
        if (request.getStartDate() == null || request.getEndDate() == null) {
            throw new RuntimeException("Start date and end date are required");
        }
        
        if (request.getStartDate().isAfter(request.getEndDate())) {
            throw new RuntimeException("Start date cannot be after end date");
        }
        
        long totalDays = ChronoUnit.DAYS.between(request.getStartDate(), request.getEndDate()) + 1;
        
        Leave leave = new Leave();
        leave.setUserId(request.getEmployeeId());
        leave.setLeaveType(request.getType());
        leave.setStartDate(request.getStartDate());
        leave.setEndDate(request.getEndDate());
        leave.setReason(request.getReason());
        leave.setTotalDays((int) totalDays);
        leave.setStatus(Leave.LeaveStatus.PENDING);
        
        return leaveRepository.save(leave);
    }

    @Transactional
    public void submitCorrectionRequest(AttendanceRequest request) {
        LocalDate requestDate = request.getDate() != null ? request.getDate() : 
                               (request.getTimestamp() != null ? request.getTimestamp().toLocalDate() : null);
        
        if (requestDate == null) {
            throw new RuntimeException("Date is required for correction request");
        }
        
        List<AttendanceSession> sessions = attendanceSessionRepository
            .findByEmployeeIdAndDate(request.getEmployeeId(), requestDate);
        
        AttendanceSession session;
        if (sessions.isEmpty()) {
            session = new AttendanceSession();
            session.setEmployeeId(request.getEmployeeId());
            session.setStartTime(requestDate.atStartOfDay());
        } else {
            session = sessions.get(0);
        }
        
        String action = request.getAction() != null ? request.getAction().toLowerCase() : "mark_present";
        
        switch (action) {
            case "mark_present":
                session.setStatus(AttendanceSession.AttendanceStatus.PRESENT);
                session.setInternalWorkSeconds(FULL_DAY_CREDIT_SECONDS);
                session.setTotalSeconds(FULL_DAY_CREDIT_SECONDS);
                break;
            case "mark_half_day":
                session.setStatus(AttendanceSession.AttendanceStatus.HALF_DAY);
                session.setInternalWorkSeconds(HALF_DAY_CREDIT_SECONDS);
                session.setTotalSeconds(HALF_DAY_CREDIT_SECONDS);
                break;
            default:
                throw new RuntimeException("Invalid correction action: " + action);
        }
        
        attendanceSessionRepository.save(session);
    }

    public List<AttendanceSession> getAttendanceHistory(Long employeeId, String startDateStr, String endDateStr) {
        if (startDateStr != null && endDateStr != null) {
            LocalDate startDate = LocalDate.parse(startDateStr);
            LocalDate endDate = LocalDate.parse(endDateStr);
            return attendanceSessionRepository.findByEmployeeIdAndDateRange(employeeId, startDate, endDate);
        } else {
            LocalDate endDate = LocalDate.now();
            LocalDate startDate = endDate.minusDays(30);
            return attendanceSessionRepository.findByEmployeeIdAndDateRange(employeeId, startDate, endDate);
        }
    }
}
