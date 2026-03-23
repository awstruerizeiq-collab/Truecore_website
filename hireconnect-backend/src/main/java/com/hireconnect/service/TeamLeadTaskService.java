package com.hireconnect.service;

import java.io.IOException;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hireconnect.dto.request.TeamLeadTaskStatusRequest;
import com.hireconnect.dto.request.TeamLeadTaskTextRequest;
import com.hireconnect.dto.request.TeamLeadTaskUpsertRequest;
import com.hireconnect.dto.response.TeamLeadTaskEntryResponse;
import com.hireconnect.dto.response.TeamLeadTaskResponse;
import com.hireconnect.entity.Notification;
import com.hireconnect.entity.TeamLeadTask;
import com.hireconnect.entity.TeamLeadTaskEntry;
import com.hireconnect.entity.User;
import com.hireconnect.repository.NotificationRepository;
import com.hireconnect.repository.TeamLeadTaskRepository;
import com.hireconnect.repository.UserRepository;
import com.hireconnect.util.FileStorageUtil;

@Service
public class TeamLeadTaskService {

    private final TeamLeadTaskRepository taskRepository;
    private final UserService userService;
    private final ObjectMapper objectMapper;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Value("${file.upload-dir:./uploads}")
    private String uploadBaseDir;

    public TeamLeadTaskService(
            TeamLeadTaskRepository taskRepository,
            UserService userService,
            ObjectMapper objectMapper,
            NotificationRepository notificationRepository,
            UserRepository userRepository
    ) {
        this.taskRepository = taskRepository;
        this.userService = userService;
        this.objectMapper = objectMapper;
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<TeamLeadTaskResponse> getTasks(String tenantHeader, Long companyHeader) {
        Scope scope = resolveScope(tenantHeader, companyHeader);
        return taskRepository
                .findByTenantCodeAndCompanyIdOrderByCreatedAtDesc(scope.tenantCode, scope.companyId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public TeamLeadTaskResponse createTask(
            TeamLeadTaskUpsertRequest request,
            MultipartFile attachment,
            String tenantHeader,
            Long companyHeader
    ) {
        Scope scope = resolveScope(tenantHeader, companyHeader);

        TeamLeadTask task = new TeamLeadTask();
        task.setTenantCode(scope.tenantCode);
        task.setCompanyId(scope.companyId);
        task.setCreatedByUserId(scope.userId);
        task.setCreatedByName(scope.authorName);

        applyRequest(task, request);
        TeamLeadTask saved = taskRepository.save(task);
        if (attachment != null && !attachment.isEmpty()) {
            saveAttachmentIfPresent(saved, attachment);
            saved = taskRepository.save(saved);
        }
        createEmployeeTaskNotification(saved, scope);
        return toResponse(saved);
    }

    @Transactional
    public TeamLeadTaskResponse updateTask(
            Long taskId,
            TeamLeadTaskUpsertRequest request,
            MultipartFile attachment,
            String tenantHeader,
            Long companyHeader
    ) {
        Scope scope = resolveScope(tenantHeader, companyHeader);
        TeamLeadTask task = getScopedTask(taskId, scope);

        applyRequest(task, request);
        if (attachment != null && !attachment.isEmpty()) {
            saveAttachmentIfPresent(task, attachment);
        }

        TeamLeadTask saved = taskRepository.save(task);
        return toResponse(saved);
    }

    @Transactional
    public TeamLeadTaskResponse updateStatus(
            Long taskId,
            TeamLeadTaskStatusRequest request,
            String tenantHeader,
            Long companyHeader
    ) {
        Scope scope = resolveScope(tenantHeader, companyHeader);
        TeamLeadTask task = getScopedTask(taskId, scope);

        if (request == null || request.getStatus() == null || request.getStatus().isBlank()) {
            throw new RuntimeException("status is required");
        }
        task.setStatus(TeamLeadTask.Status.valueOf(request.getStatus().trim().toUpperCase()));

        return toResponse(taskRepository.save(task));
    }

    @Transactional
    public TeamLeadTaskEntryResponse addComment(
            Long taskId,
            TeamLeadTaskTextRequest request,
            String tenantHeader,
            Long companyHeader
    ) {
        return addEntry(taskId, request, true, tenantHeader, companyHeader);
    }

    @Transactional
    public TeamLeadTaskEntryResponse addProgress(
            Long taskId,
            TeamLeadTaskTextRequest request,
            String tenantHeader,
            Long companyHeader
    ) {
        return addEntry(taskId, request, false, tenantHeader, companyHeader);
    }

    private TeamLeadTaskEntryResponse addEntry(
            Long taskId,
            TeamLeadTaskTextRequest request,
            boolean comment,
            String tenantHeader,
            Long companyHeader
    ) {
        Scope scope = resolveScope(tenantHeader, companyHeader);
        TeamLeadTask task = getScopedTask(taskId, scope);

        if (request == null || request.getText() == null || request.getText().trim().isEmpty()) {
            throw new RuntimeException("text is required");
        }

        TeamLeadTaskEntry entry = new TeamLeadTaskEntry();
        entry.setId(UUID.randomUUID().toString());
        entry.setAuthor(scope.authorName);
        entry.setText(request.getText().trim());
        entry.setCreatedAt(LocalDateTime.now());

        if (comment) {
            task.getComments().add(entry);
        } else {
            task.getProgress().add(entry);
        }

        taskRepository.save(task);
        return toEntryResponse(entry);
    }

    private void applyRequest(TeamLeadTask task, TeamLeadTaskUpsertRequest request) {
        if (request == null) throw new RuntimeException("Request body is required");

        if (request.getTitle() == null || request.getTitle().trim().isEmpty()) {
            throw new RuntimeException("title is required");
        }
        if (request.getDescription() == null || request.getDescription().trim().isEmpty()) {
            throw new RuntimeException("description is required");
        }

        task.setTitle(request.getTitle().trim());
        task.setDescription(request.getDescription().trim());

        task.setPriority(
                request.getPriority() == null || request.getPriority().isBlank()
                        ? TeamLeadTask.Priority.LOW
                        : TeamLeadTask.Priority.valueOf(request.getPriority().trim().toUpperCase())
        );

        task.setAssignType(
                request.getAssignType() == null || request.getAssignType().isBlank()
                        ? TeamLeadTask.AssignType.ALL
                        : TeamLeadTask.AssignType.valueOf(request.getAssignType().trim().toUpperCase())
        );

        if (request.getDueDate() == null || request.getDueDate().isBlank()) {
            task.setDueDate(null);
        } else {
            task.setDueDate(LocalDate.parse(request.getDueDate().trim()));
        }

        List<String> parsedLinks = parseLinks(request.getLinks());
        task.setLinks(parsedLinks);

        List<String> assignees = request.getAssignees() == null ? new ArrayList<>() :
                request.getAssignees().stream()
                        .filter(Objects::nonNull)
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .distinct()
                        .collect(Collectors.toList());

        if (task.getAssignType() == TeamLeadTask.AssignType.ALL) {
            assignees.clear();
        }
        task.setAssignees(assignees);

        if (task.getStatus() == null) {
            task.setStatus(TeamLeadTask.Status.TODO);
        }
    }

    private List<String> parseLinks(String linksJson) {
        if (linksJson == null || linksJson.isBlank()) return new ArrayList<>();
        try {
            List<String> links = objectMapper.readValue(linksJson, new TypeReference<List<String>>() {});
            return links.stream()
                    .filter(Objects::nonNull)
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .distinct()
                    .collect(Collectors.toList());
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    private void saveAttachmentIfPresent(TeamLeadTask task, MultipartFile attachment) {
        if (attachment == null || attachment.isEmpty()) return;

        try {
            String original = FileStorageUtil.sanitizeFilename(
                    Objects.requireNonNullElse(attachment.getOriginalFilename(), "attachment.bin"),
                    "attachment.bin"
            );
            task.setAttachmentName(original);
            task.setAttachmentContentType(attachment.getContentType());
            task.setAttachmentData(attachment.getBytes());
            task.setAttachmentPath("/api/teamlead/tasks/" + task.getId() + "/attachment");
            task.setAttachmentUrl("/api/teamlead/tasks/" + task.getId() + "/attachment");
        } catch (IOException e) {
            throw new RuntimeException("Failed to store attachment: " + e.getMessage(), e);
        }
    }

    public ResponseEntity<Resource> downloadAttachment(Long taskId, String tenantHeader, Long companyHeader) {
        Scope scope = resolveScope(tenantHeader, companyHeader);
        TeamLeadTask task = getScopedTask(taskId, scope);
        return FileStorageUtil.buildResponse(
                task.getAttachmentData(),
                buildLegacyAttachmentPath(task.getAttachmentPath()),
                task.getAttachmentContentType(),
                task.getAttachmentName(),
                true
        );
    }

    private TeamLeadTask getScopedTask(Long id, Scope scope) {
        return taskRepository.findByIdAndTenantCodeAndCompanyId(id, scope.tenantCode, scope.companyId)
                .orElseThrow(() -> new RuntimeException("Task not found"));
    }

    private Scope resolveScope(String tenantHeader, Long companyHeader) {
        try {
            User user = userService.getCurrentUser();
            if (user.getTenantCode() != null && !user.getTenantCode().isBlank() && user.getCompanyId() != null) {
                String author = user.getFullName() != null && !user.getFullName().isBlank()
                        ? user.getFullName()
                        : (user.getEmail() != null ? user.getEmail() : "Team Lead");
                return new Scope(user.getTenantCode(), user.getCompanyId(), user.getId(), author);
            }
        } catch (Exception ignored) {
            // Fallback to header-based scope
        }

        if (tenantHeader == null || tenantHeader.isBlank() || companyHeader == null) {
            throw new RuntimeException("tenantCode and companyId are required");
        }
        return new Scope(tenantHeader.trim(), companyHeader, 0L, "Team Lead");
    }

    private TeamLeadTaskResponse toResponse(TeamLeadTask t) {
        TeamLeadTaskResponse r = new TeamLeadTaskResponse();
        r.setId(t.getId());
        r.setTitle(t.getTitle());
        r.setDescription(t.getDescription());
        r.setPriority(t.getPriority().name());
        r.setStatus(t.getStatus().name());
        r.setAssignType(t.getAssignType().name());
        r.setDueDate(t.getDueDate());
        r.setAssignees(t.getAssignees());
        r.setLinks(t.getLinks());
        r.setAttachmentName(t.getAttachmentName());
        r.setAttachmentUrl(t.getAttachmentUrl());
        r.setCanEdit(true);
        r.setComments(t.getComments().stream().map(this::toEntryResponse).collect(Collectors.toList()));
        r.setProgress(t.getProgress().stream().map(this::toEntryResponse).collect(Collectors.toList()));
        r.setCreatedAt(t.getCreatedAt());
        r.setUpdatedAt(t.getUpdatedAt());
        return r;
    }

    private void createEmployeeTaskNotification(TeamLeadTask task, Scope scope) {
        List<String> targetEmployeeIds = buildTargetEmployeeIds(task, scope);
        if (targetEmployeeIds.isEmpty()) {
            return;
        }

        Notification notification = new Notification();
        notification.setTitle("New Task Assigned: " + task.getTitle());
        notification.setMessage(buildTaskNotificationMessage(task, scope.authorName));
        notification.setPriority(mapNotificationPriority(task.getPriority()));
        notification.setStatus(Notification.Status.PUBLISHED);
        notification.setPinned(false);
        notification.setReqAck(false);
        notification.setSendEmail(false);
        notification.setSendPush(false);
        notification.setTargetType(Notification.TargetType.SPECIFIC);
        notification.setTargetEmployeeIds(targetEmployeeIds);
        notification.setTargetDepts(List.of());
        notification.setScheduledAt(LocalDateTime.now());
        notification.setExpiresAt(null);
        notification.setAttachmentName(task.getAttachmentName());
        notification.setAttachmentPath(task.getAttachmentPath());
        notification.setAttachmentContentType(task.getAttachmentContentType());
        notification.setAttachmentData(task.getAttachmentData());

        notificationRepository.save(notification);
    }

    private String buildLegacyAttachmentPath(String storedPath) {
        if (storedPath == null || storedPath.isBlank() || storedPath.startsWith("/api/")) {
            return null;
        }
        if (storedPath.startsWith("/uploads/")) {
            return storedPath;
        }
        return Paths.get(uploadBaseDir).resolve(storedPath).normalize().toString();
    }

    private List<String> buildTargetEmployeeIds(TeamLeadTask task, Scope scope) {
        List<User> companyEmployees = userRepository.findEmployeesByTenantCompany(scope.tenantCode, scope.companyId);
        if (companyEmployees == null || companyEmployees.isEmpty()) {
            return List.of();
        }

        if (task.getAssignType() == TeamLeadTask.AssignType.ALL) {
            return companyEmployees.stream()
                    .flatMap(u -> Stream.of(
                            String.valueOf(u.getId()),
                            u.getEmployeeId() == null ? "" : u.getEmployeeId().trim()
                    ))
                    .filter(s -> s != null && !s.isBlank())
                    .distinct()
                    .collect(Collectors.toList());
        }

        Set<String> specificTokens = (task.getAssignees() == null ? List.<String>of() : task.getAssignees())
                .stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .collect(Collectors.toSet());

        if (specificTokens.isEmpty()) {
            return List.of();
        }

        List<String> resolved = new ArrayList<>(specificTokens);
        companyEmployees.forEach(u -> {
            String userId = String.valueOf(u.getId());
            String employeeId = u.getEmployeeId() == null ? "" : u.getEmployeeId().trim();
            if (specificTokens.contains(userId) || (!employeeId.isBlank() && specificTokens.contains(employeeId))) {
                resolved.add(userId);
                if (!employeeId.isBlank()) {
                    resolved.add(employeeId);
                }
            }
        });

        return resolved.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .distinct()
                .collect(Collectors.toList());
    }

    private String buildTaskNotificationMessage(TeamLeadTask task, String authorName) {
        String duePart = task.getDueDate() == null ? "No due date" : ("Due: " + task.getDueDate());
        String linksPart = (task.getLinks() == null || task.getLinks().isEmpty())
                ? ""
                : "\nLinks:\n" + task.getLinks().stream().filter(Objects::nonNull).map(String::trim)
                    .filter(s -> !s.isBlank()).collect(Collectors.joining("\n"));
        return String.format(
                "%s assigned a %s priority task. %s. %s%s",
                authorName == null || authorName.isBlank() ? "Team Lead" : authorName,
                task.getPriority().name(),
                duePart,
                task.getDescription(),
                linksPart
        );
    }

    private Notification.Priority mapNotificationPriority(TeamLeadTask.Priority priority) {
        if (priority == null) return Notification.Priority.MEDIUM;
        return switch (priority) {
            case HIGH -> Notification.Priority.HIGH;
            case MEDIUM -> Notification.Priority.MEDIUM;
            case LOW -> Notification.Priority.LOW;
        };
    }

    private TeamLeadTaskEntryResponse toEntryResponse(TeamLeadTaskEntry e) {
        TeamLeadTaskEntryResponse r = new TeamLeadTaskEntryResponse();
        r.setId(e.getId());
        r.setAuthor(e.getAuthor());
        r.setText(e.getText());
        r.setCreatedAt(e.getCreatedAt());
        return r;
    }

    private static final class Scope {
        private final String tenantCode;
        private final Long companyId;
        private final Long userId;
        private final String authorName;

        private Scope(String tenantCode, Long companyId, Long userId, String authorName) {
            this.tenantCode = tenantCode;
            this.companyId = companyId;
            this.userId = userId;
            this.authorName = authorName;
        }
    }
}
