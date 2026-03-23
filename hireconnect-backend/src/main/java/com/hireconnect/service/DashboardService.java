package com.hireconnect.service;

import com.hireconnect.entity.AttendanceSession;
import com.hireconnect.entity.Leave;
import com.hireconnect.entity.Timesheet;
import com.hireconnect.entity.User;
import com.hireconnect.repository.AttendanceSessionRepository;
import com.hireconnect.repository.LeaveRepository;
import com.hireconnect.repository.TimesheetRepository;
import com.hireconnect.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final UserRepository userRepository;
    private final AttendanceSessionRepository attendanceSessionRepository;
    private final LeaveRepository leaveRepository;
    private final TimesheetRepository timesheetRepository;

    @Autowired
    public DashboardService(
            UserRepository userRepository,
            AttendanceSessionRepository attendanceSessionRepository,
            LeaveRepository leaveRepository,
            TimesheetRepository timesheetRepository
    ) {
        this.userRepository = userRepository;
        this.attendanceSessionRepository = attendanceSessionRepository;
        this.leaveRepository = leaveRepository;
        this.timesheetRepository = timesheetRepository;
    }

    public Map<String, Object> getEmployeeDashboard(Long employeeId) {
        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        Map<String, Object> dashboard = new HashMap<>();
        dashboard.put("employee", employee);

        LocalDate today = LocalDate.now();
        LocalDate monthStart = today.withDayOfMonth(1);

        List<AttendanceSession> monthSessions = attendanceSessionRepository.findByEmployeeIdAndDateRange(
                employeeId,
                monthStart,
                today
        );

        int totalWorkSeconds = monthSessions.stream()
                .mapToInt(session -> Math.max(
                        safeInt(session.getTotalSeconds()),
                        safeInt(session.getInternalWorkSeconds())
                ))
                .sum();

        Set<LocalDate> activeDays = monthSessions.stream()
                .map(session -> session.getStartTime() == null ? null : session.getStartTime().toLocalDate())
                .filter(date -> date != null)
                .collect(Collectors.toSet());

        double loggedHours = roundOneDecimal(totalWorkSeconds / 3600.0);
        int activeDayCount = activeDays.size();
        double avgHoursPerDay = activeDayCount > 0 ? roundOneDecimal(loggedHours / activeDayCount) : 0.0;
        double targetHours = activeDayCount * 8.0;
        double hoursAboveTarget = roundOneDecimal(loggedHours - targetHours);

        int projectProgress = targetHours > 0
                ? (int) Math.max(0, Math.min(100, Math.round((loggedHours / targetHours) * 100.0)))
                : 0;

        List<Leave> leaves = leaveRepository.findByUserId(employeeId);
        long pendingLeaves = leaves.stream()
                .filter(leave -> leave != null && leave.getStatus() == Leave.LeaveStatus.PENDING)
                .count();

        List<Timesheet> timesheets = timesheetRepository.findByEmployeeIdOrderByCreatedAtDesc(employeeId);
        boolean hasTimesheetToday = timesheets.stream().anyMatch(timesheet -> {
            LocalDate timesheetDate = timesheet != null ? timesheet.getDate() : null;
            if (timesheetDate != null) {
                return today.equals(timesheetDate);
            }
            return timesheet != null
                    && timesheet.getSubmittedAt() != null
                    && today.equals(timesheet.getSubmittedAt().toLocalDate());
        });

        List<AttendanceSession> todaySessions = attendanceSessionRepository.findByEmployeeIdAndDate(employeeId, today);
        String todayStatus = todaySessions.isEmpty()
                ? "No data"
                : String.valueOf(todaySessions.get(0).getStatus());

        String currentProject = firstNonBlank(
                extractLatestTaskSummary(timesheets),
                employee.getPosition(),
                employee.getDepartment(),
                "No project assigned"
        );

        String performance = loggedHours >= 160 ? "Excellent"
                : loggedHours >= 120 ? "Good"
                : loggedHours > 0 ? "Needs Improvement"
                : "No data";

        List<String> pendingItems = new ArrayList<>();
        if (pendingLeaves > 0) {
            pendingItems.add(pendingLeaves + " leave request(s) pending approval");
        }
        if (!hasTimesheetToday) {
            pendingItems.add("Today's timesheet is pending");
        }
        if (todaySessions.isEmpty()) {
            pendingItems.add("Attendance not marked for today");
        }

        dashboard.put("pendingLeaves", pendingLeaves);
        dashboard.put("todayStatus", todayStatus);
        dashboard.put("performance", performance);
        dashboard.put("currentProject", currentProject);
        dashboard.put("projectStatus", employee.getStatus() == null ? "Active" : employee.getStatus().name());
        dashboard.put("projectProgress", projectProgress);
        dashboard.put("loggedHours", loggedHours);
        dashboard.put("hoursAboveTarget", hoursAboveTarget);
        dashboard.put("avgHoursPerDay", avgHoursPerDay);
        dashboard.put("pendingItems", pendingItems);

        return dashboard;
    }

    public Map<String, Object> getAdminDashboard() {
        Map<String, Object> dashboard = new HashMap<>();
        dashboard.put("totalEmployees", userRepository.countByRole(User.Role.EMPLOYEE));
        dashboard.put("totalAdmins", userRepository.countByRole(User.Role.ADMIN));
        dashboard.put("presentToday", attendanceSessionRepository.countPresentToday());

        return dashboard;
    }

    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("totalEmployees", userRepository.countByRole(User.Role.EMPLOYEE));

        return stats;
    }

    private int safeInt(Integer value) {
        return value == null ? 0 : Math.max(0, value);
    }

    private double roundOneDecimal(double value) {
        return Math.round(value * 10.0) / 10.0;
    }

    private String extractLatestTaskSummary(List<Timesheet> timesheets) {
        if (timesheets == null || timesheets.isEmpty()) {
            return "";
        }

        Timesheet latest = timesheets.get(0);
        String tasks = latest == null ? "" : String.valueOf(latest.getTasks() == null ? "" : latest.getTasks()).trim();
        if (tasks.isEmpty()) {
            return "";
        }

        return tasks.length() > 60 ? tasks.substring(0, 60) + "..." : tasks;
    }

    private String firstNonBlank(String... values) {
        if (values == null) {
            return "";
        }

        for (String value : values) {
            if (value != null && !value.trim().isEmpty()) {
                return value.trim();
            }
        }

        return "";
    }
}
