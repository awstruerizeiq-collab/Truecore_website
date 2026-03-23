package com.hireconnect.service;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.hireconnect.dto.request.NotificationRequest;
import com.hireconnect.dto.response.AdminNotificationResponse;
import com.hireconnect.dto.response.EmployeeNotificationResponse;
import com.hireconnect.entity.Notification;
import com.hireconnect.entity.UserNotification;
import com.hireconnect.repository.NotificationRepository;
import com.hireconnect.repository.UserNotificationRepository;
import com.hireconnect.util.FileStorageUtil;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepo;
    private final UserNotificationRepository userNotificationRepo;

    @Value("${app.base-url:http://localhost:8080}")
    private String appBaseUrl;

    @Value("${file.upload-dir:uploads}")
    private String legacyUploadDir;

    @Autowired
    public NotificationService(
            NotificationRepository notificationRepo,
            UserNotificationRepository userNotificationRepo
    ) {
        this.notificationRepo = notificationRepo;
        this.userNotificationRepo = userNotificationRepo;
    }

    @Transactional
    public Notification createNotification(NotificationRequest request, MultipartFile file) throws IOException {
        Notification notification = request.toEntity();
        populateAttachment(notification, file);

        Notification saved = notificationRepo.save(notification);
        if (file != null && !file.isEmpty()) {
            saved.setAttachmentPath(relativeAttachmentPath(saved.getId()));
            saved = notificationRepo.save(saved);
        }
        return saved;
    }

    @Transactional
    public void deleteNotification(Long id) {
        notificationRepo.deleteById(id);
    }

    @Transactional
    public void archiveNotification(Long id) {
        Notification notification = notificationRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        notification.setStatus(Notification.Status.ARCHIVED);
        notificationRepo.save(notification);
    }

    @Transactional(readOnly = true)
    public List<AdminNotificationResponse> getAllAdminNotifications() {
        return notificationRepo.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(notification -> {
                    AdminNotificationResponse dto = new AdminNotificationResponse();
                    dto.setId(notification.getId());
                    dto.setTitle(notification.getTitle());
                    dto.setMessage(notification.getMessage());
                    dto.setPriority(notification.getPriority().name());
                    dto.setStatus(notification.getStatus().name());
                    dto.setPinned(notification.isPinned());
                    dto.setReqAck(notification.isReqAck());
                    dto.setTargetDepts(
                            notification.getTargetDepts() == null ? List.of() : List.copyOf(notification.getTargetDepts())
                    );
                    dto.setTargetEmployeeIds(
                            notification.getTargetEmployeeIds() == null
                                    ? List.of()
                                    : List.copyOf(notification.getTargetEmployeeIds())
                    );
                    dto.setCreatedAt(notification.getCreatedAt());
                    dto.setScheduledAt(notification.getScheduledAt());
                    dto.setExpiresAt(notification.getExpiresAt());
                    dto.setAttachmentName(notification.getAttachmentName());
                    return dto;
                })
                .toList();
    }

    public List<EmployeeNotificationResponse> getNotificationsForEmployee(String empId, String dept) {
        List<Notification> notifications = notificationRepo.findRelevantNotifications(empId, dept, LocalDateTime.now());

        return notifications.stream()
                .map(notification -> {
                    UserNotification interaction = userNotificationRepo
                            .findByNotificationIdAndEmployeeId(notification.getId(), empId)
                            .orElseGet(() -> createEmptyInteraction(notification.getId(), empId));

                    if (interaction.isDismissed()) return null;

                    EmployeeNotificationResponse dto = new EmployeeNotificationResponse();
                    dto.setId(notification.getId());
                    dto.setTitle(notification.getTitle());
                    dto.setMessage(notification.getMessage());
                    dto.setPriority(notification.getPriority().name());
                    dto.setPinned(notification.isPinned());
                    dto.setReqAck(notification.isReqAck());
                    dto.setAttachmentName(notification.getAttachmentName());

                    if (notification.getAttachmentName() != null) {
                        dto.setAttachmentUrl(buildAttachmentUrl(notification.getId()));
                    }

                    dto.setCreatedAt(notification.getCreatedAt());
                    dto.setExpiresAt(notification.getExpiresAt());
                    dto.setRead(interaction.isRead());
                    dto.setAcknowledged(interaction.isAcknowledged());
                    return dto;
                })
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toList());
    }

    @Transactional
    public void markAsRead(Long notificationId, String empId) {
        UserNotification interaction = getOrCreateInteraction(notificationId, empId);

        if (!interaction.isRead()) {
            interaction.setRead(true);
            interaction.setReadAt(LocalDateTime.now());
            userNotificationRepo.save(interaction);
        }
    }

    @Transactional
    public void markAllRead(String empId) {
        String fallbackDept = "ALL";

        List<Notification> notifications = notificationRepo.findRelevantNotifications(
                empId,
                fallbackDept,
                LocalDateTime.now()
        );

        for (Notification notification : notifications) {
            UserNotification interaction = getOrCreateInteraction(notification.getId(), empId);

            if (!interaction.isRead()) {
                interaction.setRead(true);
                interaction.setReadAt(LocalDateTime.now());
                userNotificationRepo.save(interaction);
            }
        }
    }

    @Transactional
    public void acknowledge(Long notificationId, String empId) {
        UserNotification interaction = getOrCreateInteraction(notificationId, empId);

        interaction.setAcknowledged(true);
        interaction.setAcknowledgedAt(LocalDateTime.now());
        interaction.setRead(true);

        userNotificationRepo.save(interaction);
    }

    @Transactional
    public void dismiss(Long notificationId, String empId) {
        UserNotification interaction = getOrCreateInteraction(notificationId, empId);
        interaction.setDismissed(true);
        userNotificationRepo.save(interaction);
    }

    @Transactional
    public Notification updateNotification(Long id, NotificationRequest request, MultipartFile file) throws IOException {
        Notification existing = notificationRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        existing.setTitle(request.getTitle());
        existing.setMessage(request.getMessage());
        existing.setPriority(request.resolvePriority());
        existing.setStatus(request.resolveStatus());
        existing.setPinned(request.isPinned());
        existing.setReqAck(request.isReqAck());
        existing.setSendEmail(request.isSendEmail());
        existing.setSendPush(request.isSendPush());
        existing.setTargetType(request.resolveTargetType());
        existing.setTargetDepts(request.getTargetDepts() == null ? List.of() : request.getTargetDepts());
        existing.setTargetEmployeeIds(request.getTargetEmployeeIds() == null ? List.of() : request.getTargetEmployeeIds());
        existing.setScheduledAt(request.getScheduledAt());
        existing.setExpiresAt(request.getExpiresAt());

        populateAttachment(existing, file);
        if (file != null && !file.isEmpty()) {
            existing.setAttachmentPath(relativeAttachmentPath(existing.getId()));
        }

        return notificationRepo.save(existing);
    }

    public ResponseEntity<Resource> downloadAttachment(Long notificationId) {
        Notification notification = notificationRepo.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        return FileStorageUtil.buildResponse(
                notification.getAttachmentData(),
                buildLegacyAttachmentPath(notification),
                notification.getAttachmentContentType(),
                notification.getAttachmentName(),
                true
        );
    }

    private void populateAttachment(Notification notification, MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            return;
        }
        notification.setAttachmentName(FileStorageUtil.sanitizeFilename(file.getOriginalFilename(), "attachment"));
        notification.setAttachmentContentType(file.getContentType());
        notification.setAttachmentData(file.getBytes());
    }

    private String relativeAttachmentPath(Long notificationId) {
        return "/api/notifications/" + notificationId + "/attachment";
    }

    private String buildAttachmentUrl(Long notificationId) {
        return FileStorageUtil.absoluteUrl(appBaseUrl, relativeAttachmentPath(notificationId));
    }

    private String buildLegacyAttachmentPath(Notification notification) {
        if (notification.getAttachmentPath() == null || notification.getAttachmentPath().isBlank()) {
            return null;
        }
        if (notification.getAttachmentPath().startsWith("/api/")) {
            return null;
        }
        if (notification.getAttachmentPath().startsWith("/uploads/")) {
            return notification.getAttachmentPath();
        }
        return legacyUploadDir + "/" + notification.getAttachmentPath();
    }

    private UserNotification getOrCreateInteraction(Long notifId, String empId) {
        return userNotificationRepo
                .findByNotificationIdAndEmployeeId(notifId, empId)
                .orElseGet(() -> createEmptyInteraction(notifId, empId));
    }

    private UserNotification createEmptyInteraction(Long notifId, String empId) {
        UserNotification userNotification = new UserNotification();
        userNotification.setNotificationId(notifId);
        userNotification.setEmployeeId(empId);
        userNotification.setRead(false);
        userNotification.setAcknowledged(false);
        userNotification.setDismissed(false);
        return userNotification;
    }
}
