package com.hireconnect.service;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hireconnect.dto.request.PerformanceRequest;
import com.hireconnect.dto.response.FeedbackResponse;
import com.hireconnect.dto.response.PerformanceResponse;
import com.hireconnect.entity.PerformanceData;
import com.hireconnect.entity.PerformanceFeedback;
import com.hireconnect.entity.User;
import com.hireconnect.repository.PerformanceFeedbackRepository;
import com.hireconnect.repository.PerformanceRepository;
import com.hireconnect.repository.EmployeeDetailsRepository;
import com.hireconnect.repository.UserRepository;

@Service
public class PerformanceService {

    @Autowired
    private PerformanceRepository performanceRepository;

    @Autowired
    private PerformanceFeedbackRepository feedbackRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmployeeDetailsRepository employeeDetailsRepository;

    /* ================= READ ================= */

    @Transactional(readOnly = true)
    public List<PerformanceResponse> getAllPerformance() {
        return performanceRepository.findAllWithFeedback()
                .stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    // ✅ Tenant-based list (your dashboard table should use this)
    @Transactional(readOnly = true)
    public List<PerformanceResponse> getTenantPerformance(String tenantCode) {
        return performanceRepository.findAllByTenantCodeWithFeedback(tenantCode)
                .stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PerformanceResponse> getTopTenantPerformance(String tenantCode, int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 50));
        return performanceRepository.findAllByTenantCodeWithFeedback(tenantCode)
                .stream()
                .sorted((a, b) -> Integer.compare(
                        b.getCurrentScore() != null ? b.getCurrentScore() : 0,
                        a.getCurrentScore() != null ? a.getCurrentScore() : 0
                ))
                .limit(safeLimit)
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PerformanceResponse getPerformanceByEmployeeId(String employeeId) {
        PerformanceData data = performanceRepository.findByEmployeeIdWithFeedback(employeeId)
                .orElseThrow(() -> new RuntimeException("Performance not found for employee: " + employeeId));
        return convertToResponse(data);
    }

    @Transactional(readOnly = true)
    public PerformanceResponse getPerformanceByUserId(Long userId) {
        PerformanceData data = performanceRepository.findByUserIdWithFeedback(userId)
                .orElseThrow(() -> new RuntimeException("Performance not found for user ID: " + userId));
        return convertToResponse(data);
    }

    @Transactional(readOnly = true)
    public PerformanceResponse getCurrentUserPerformance() {
        User user = getAuthenticatedUser();

        boolean exists = performanceRepository.existsByUserId(user.getId());
        if (!exists) {
            throw new RuntimeException("No performance record found for this user. Please contact your administrator.");
        }

        return getPerformanceByUserId(user.getId());
    }

    /* ================= CREATE ================= */

    @Transactional
    public PerformanceResponse createPerformance(PerformanceRequest request, String tenantCode) {

        if (tenantCode == null || tenantCode.trim().isEmpty()) {
            throw new RuntimeException("Tenant code missing in request header");
        }

        if (request.getEmployeeId() == null || request.getEmployeeId().trim().isEmpty()) {
            throw new RuntimeException("Employee ID is required");
        }

        if (performanceRepository.existsByEmployeeIdAndTenantCode(request.getEmployeeId(), tenantCode)) {
            throw new RuntimeException("Performance record already exists for employee ID: " + request.getEmployeeId());
        }

        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new RuntimeException("Employee name is required");
        }

        if (request.getUserId() == null) {
            throw new RuntimeException("User ID is required");
        }

        if (performanceRepository.existsByUserId(request.getUserId())) {
            throw new RuntimeException("Performance record already exists for this user");
        }

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + request.getUserId()));

        PerformanceData data = new PerformanceData();

        // ✅ STORE TENANT CODE AUTOMATICALLY
        data.setTenantCode(tenantCode);

        data.setEmployeeId(request.getEmployeeId().trim());
        data.setName(request.getName().trim());
        data.setDepartment(request.getDepartment() != null ? request.getDepartment() : "");
        data.setPosition(request.getPosition() != null ? request.getPosition() : "");
        data.setCurrentScore(valueOrZero(request.getCurrentScore()));
        data.setTasksCompleted(valueOrZero(request.getTasksCompleted()));
        data.setTotalTasks(valueOrZero(request.getTotalTasks()));
        data.setAttendance(valueOrZero(request.getAttendance()));
        data.setProductivity(valueOrZero(request.getProductivity()));
        data.setQualityScore(valueOrZero(request.getQualityScore()));
        data.setPunctuality(valueOrZero(request.getPunctuality()));
        data.setValidated(false);
        data.setMonthlyScores(request.getMonthlyScores() != null ? request.getMonthlyScores() : new ArrayList<>());
        data.setUser(user);

        PerformanceData saved = performanceRepository.save(data);

        return convertToResponse(
                performanceRepository.findByIdWithFeedback(saved.getId()).orElse(saved)
        );
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getCurrentTeamLeadContext() {
        User actor = getAuthenticatedUser();
        ensureTeamLead(actor);

        Map<String, Object> ctx = new LinkedHashMap<>();
        ctx.put("name", actor.getFullName());
        ctx.put("employeeId", actor.getEmployeeId());
        ctx.put("tenantCode", actor.getTenantCode());
        return ctx;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getCurrentTeamLeadMembers() {
        User actor = getAuthenticatedUser();
        ensureTeamLead(actor);

        List<User> members = getTeamMembersForTeamLead(actor);
        return members.stream().map(user -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("userId", user.getId());
            m.put("employeeId", user.getEmployeeId());
            m.put("name", user.getFullName());
            m.put("officialEmail", user.getOfficialEmail() != null ? user.getOfficialEmail() : user.getEmail());
            m.put("department", user.getDepartment());
            m.put("position", user.getPosition());
            return m;
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PerformanceResponse> getCurrentTeamLeadRankList() {
        User actor = getAuthenticatedUser();
        ensureTeamLead(actor);

        List<User> members = getTeamMembersForTeamLead(actor);
        List<Long> memberUserIds = members.stream()
                .map(User::getId)
                .filter(id -> id != null)
                .collect(Collectors.toList());

        if (memberUserIds.isEmpty()) {
            return Collections.emptyList();
        }

        return performanceRepository.findByTenantCodeAndUserIdsWithFeedback(actor.getTenantCode(), memberUserIds)
                .stream()
                .sorted(Comparator.comparing(
                        (PerformanceData p) -> p.getCurrentScore() != null ? p.getCurrentScore() : 0
                ).reversed())
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public PerformanceResponse createPerformanceForCurrentTeamLead(PerformanceRequest request) {
        User actor = getAuthenticatedUser();
        ensureTeamLead(actor);

        if (request.getUserId() == null) {
            throw new RuntimeException("User ID is required");
        }

        List<User> members = getTeamMembersForTeamLead(actor);
        User target = members.stream()
                .filter(member -> request.getUserId().equals(member.getId()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("You can add performance only for your team members"));

        request.setUserId(target.getId());
        request.setEmployeeId(target.getEmployeeId());
        request.setName(target.getFullName());
        request.setDepartment(target.getDepartment());
        request.setPosition(target.getPosition());

        return createPerformance(request, actor.getTenantCode());
    }

    /* ================= UPDATE ================= */

    @Transactional
    public PerformanceResponse updatePerformance(Long id, PerformanceRequest request, String tenantCode) {

        PerformanceData data = performanceRepository.findByIdAndTenantCode(id, tenantCode)
                .orElseThrow(() -> new RuntimeException("Performance not found for this tenant"));

        if (request.getName() != null && !request.getName().trim().isEmpty()) {
            data.setName(request.getName().trim());
        }
        if (request.getDepartment() != null) data.setDepartment(request.getDepartment());
        if (request.getPosition() != null) data.setPosition(request.getPosition());
        if (request.getCurrentScore() != null) data.setCurrentScore(request.getCurrentScore());
        if (request.getTasksCompleted() != null) data.setTasksCompleted(request.getTasksCompleted());
        if (request.getTotalTasks() != null) data.setTotalTasks(request.getTotalTasks());
        if (request.getAttendance() != null) data.setAttendance(request.getAttendance());
        if (request.getProductivity() != null) data.setProductivity(request.getProductivity());
        if (request.getQualityScore() != null) data.setQualityScore(request.getQualityScore());
        if (request.getPunctuality() != null) data.setPunctuality(request.getPunctuality());
        if (request.getMonthlyScores() != null) data.setMonthlyScores(request.getMonthlyScores());

        PerformanceData saved = performanceRepository.save(data);
        return convertToResponse(saved);
    }

    /* ================= ADMIN ACTIONS ================= */

    @Transactional
    public void setValidationStatus(Long id, Boolean validated, String tenantCode) {
        PerformanceData data = performanceRepository.findByIdAndTenantCode(id, tenantCode)
                .orElseThrow(() -> new RuntimeException("Performance not found for this tenant"));

        data.setValidated(validated != null ? validated : false);
        performanceRepository.save(data);
    }

    @Transactional
    public void deletePerformance(Long id, String tenantCode) {
        PerformanceData data = performanceRepository.findByIdAndTenantCode(id, tenantCode)
                .orElseThrow(() -> new RuntimeException("Performance not found for this tenant"));

        performanceRepository.delete(data);
    }

    /* ================= FEEDBACK ================= */

    @Transactional
    public void addFeedback(Long performanceId, String title, String comment, String author, String tenantCode) {
        PerformanceData data = performanceRepository.findByIdAndTenantCode(performanceId, tenantCode)
                .orElseThrow(() -> new RuntimeException("Performance not found for this tenant"));

        if (title == null || title.trim().isEmpty()) throw new RuntimeException("Feedback title is required");
        if (comment == null || comment.trim().isEmpty()) throw new RuntimeException("Feedback comment is required");

        PerformanceFeedback feedback = new PerformanceFeedback();
        feedback.setTitle(title.trim());
        feedback.setComment(comment.trim());
        feedback.setAuthor(author != null ? author.trim() : "Anonymous");
        feedback.setPerformanceData(data);

        feedbackRepository.save(feedback);
    }

    /* ================= HELPERS ================= */

    private int valueOrZero(Integer value) {
        return value != null ? value : 0;
    }

    private PerformanceResponse convertToResponse(PerformanceData data) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd, yyyy");

        List<FeedbackResponse> feedbackList = new ArrayList<>();
        try {
            if (data.getFeedback() != null && !data.getFeedback().isEmpty()) {
                feedbackList = data.getFeedback().stream()
                        .map(f -> new FeedbackResponse(
                                f.getId(),
                                f.getTitle(),
                                f.getComment(),
                                f.getAuthor(),
                                f.getDate() != null ? f.getDate().format(formatter) : ""
                        ))
                        .collect(Collectors.toList());
            }
        } catch (Exception ignored) {}

        return new PerformanceResponse(
                data.getId(),
                data.getUser() != null ? data.getUser().getId() : null,
                data.getEmployeeId(),
                data.getName(),
                data.getDepartment(),
                data.getPosition(),
                data.getCurrentScore(),
                data.getStatus(),
                data.getTasksCompleted(),
                data.getTotalTasks(),
                data.getAttendance(),
                data.getProductivity(),
                data.getQualityScore(),
                data.getPunctuality(),
                data.getValidated(),
                data.getLastUpdated(),
                data.getMonthlyScores(),
                feedbackList
        );
    }

    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() ||
                "anonymousUser".equals(authentication.getPrincipal())) {
            throw new RuntimeException("User is not authenticated");
        }
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
    }

    private void ensureTeamLead(User actor) {
        if (actor.getRole() != User.Role.TEAM_LEAD) {
            throw new RuntimeException("Access denied. Only Team Leads can access this resource.");
        }
        if (actor.getTenantCode() == null || actor.getTenantCode().isBlank()) {
            throw new RuntimeException("Tenant mapping missing for current user");
        }
        if (actor.getEmployeeId() == null || actor.getEmployeeId().isBlank()) {
            throw new RuntimeException("Employee ID missing for current Team Lead");
        }
    }

    private List<User> getTeamMembersForTeamLead(User actor) {
        return employeeDetailsRepository
                .findByTenantCodeAndTeamLeader(actor.getTenantCode().trim(), actor.getEmployeeId().trim())
                .stream()
                .map(employeeDetails -> employeeDetails.getUser())
                .filter(user -> user != null && user.getId() != null)
                .filter(user -> user.getRole() == User.Role.EMPLOYEE)
                .collect(Collectors.toList());
    }
}