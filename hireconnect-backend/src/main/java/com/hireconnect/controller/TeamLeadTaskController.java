package com.hireconnect.controller;

import com.hireconnect.dto.request.TeamLeadTaskStatusRequest;
import com.hireconnect.dto.request.TeamLeadTaskTextRequest;
import com.hireconnect.dto.request.TeamLeadTaskUpsertRequest;
import com.hireconnect.dto.response.TeamLeadTaskEntryResponse;
import com.hireconnect.dto.response.TeamLeadTaskResponse;
import com.hireconnect.service.TeamLeadTaskService;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/teamlead/tasks")
@CrossOrigin(
	    origins = {"http://localhost:5173", "http://localhost:3000", "https://app.truecorehr.com"},
	    allowCredentials = "true"
	)
public class TeamLeadTaskController {

    private final TeamLeadTaskService service;

    public TeamLeadTaskController(TeamLeadTaskService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<TeamLeadTaskResponse>> getTasks(
            @RequestHeader(value = "X-Tenant-Code", required = false) String tenantCode,
            @RequestHeader(value = "X-Company-Id", required = false) Long companyId,
            @RequestParam(value = "tenantCode", required = false) String tenantParam,
            @RequestParam(value = "companyId", required = false) Long companyParam
    ) {
        return ResponseEntity.ok(service.getTasks(
                tenantCode != null ? tenantCode : tenantParam,
                companyId != null ? companyId : companyParam
        ));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> createTask(
            @ModelAttribute TeamLeadTaskUpsertRequest request,
            @RequestParam(value = "attachment", required = false) MultipartFile attachment,
            @RequestHeader(value = "X-Tenant-Code", required = false) String tenantCode,
            @RequestHeader(value = "X-Company-Id", required = false) Long companyId,
            @RequestParam(value = "tenantCode", required = false) String tenantParam,
            @RequestParam(value = "companyId", required = false) Long companyParam
    ) {
        TeamLeadTaskResponse data = service.createTask(
                request,
                attachment,
                tenantCode != null ? tenantCode : tenantParam,
                companyId != null ? companyId : companyParam
        );
        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("data", data);
        return ResponseEntity.ok(res);
    }

    @PutMapping(value = "/{taskId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> updateTask(
            @PathVariable Long taskId,
            @ModelAttribute TeamLeadTaskUpsertRequest request,
            @RequestParam(value = "attachment", required = false) MultipartFile attachment,
            @RequestHeader(value = "X-Tenant-Code", required = false) String tenantCode,
            @RequestHeader(value = "X-Company-Id", required = false) Long companyId,
            @RequestParam(value = "tenantCode", required = false) String tenantParam,
            @RequestParam(value = "companyId", required = false) Long companyParam
    ) {
        TeamLeadTaskResponse data = service.updateTask(
                taskId,
                request,
                attachment,
                tenantCode != null ? tenantCode : tenantParam,
                companyId != null ? companyId : companyParam
        );
        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("data", data);
        return ResponseEntity.ok(res);
    }

    @PatchMapping("/{taskId}/status")
    public ResponseEntity<TeamLeadTaskResponse> updateStatus(
            @PathVariable Long taskId,
            @RequestBody TeamLeadTaskStatusRequest request,
            @RequestHeader(value = "X-Tenant-Code", required = false) String tenantCode,
            @RequestHeader(value = "X-Company-Id", required = false) Long companyId,
            @RequestParam(value = "tenantCode", required = false) String tenantParam,
            @RequestParam(value = "companyId", required = false) Long companyParam
    ) {
        return ResponseEntity.ok(service.updateStatus(
                taskId,
                request,
                tenantCode != null ? tenantCode : tenantParam,
                companyId != null ? companyId : companyParam
        ));
    }

    @PostMapping("/{taskId}/comments")
    public ResponseEntity<TeamLeadTaskEntryResponse> addComment(
            @PathVariable Long taskId,
            @RequestBody TeamLeadTaskTextRequest request,
            @RequestHeader(value = "X-Tenant-Code", required = false) String tenantCode,
            @RequestHeader(value = "X-Company-Id", required = false) Long companyId,
            @RequestParam(value = "tenantCode", required = false) String tenantParam,
            @RequestParam(value = "companyId", required = false) Long companyParam
    ) {
        return ResponseEntity.ok(service.addComment(
                taskId,
                request,
                tenantCode != null ? tenantCode : tenantParam,
                companyId != null ? companyId : companyParam
        ));
    }

    @PostMapping("/{taskId}/progress")
    public ResponseEntity<TeamLeadTaskEntryResponse> addProgress(
            @PathVariable Long taskId,
            @RequestBody TeamLeadTaskTextRequest request,
            @RequestHeader(value = "X-Tenant-Code", required = false) String tenantCode,
            @RequestHeader(value = "X-Company-Id", required = false) Long companyId,
            @RequestParam(value = "tenantCode", required = false) String tenantParam,
            @RequestParam(value = "companyId", required = false) Long companyParam
    ) {
        return ResponseEntity.ok(service.addProgress(
                taskId,
                request,
                tenantCode != null ? tenantCode : tenantParam,
                companyId != null ? companyId : companyParam
        ));
    }

    @GetMapping("/{taskId}/attachment")
    public ResponseEntity<Resource> downloadAttachment(
            @PathVariable Long taskId,
            @RequestHeader(value = "X-Tenant-Code", required = false) String tenantCode,
            @RequestHeader(value = "X-Company-Id", required = false) Long companyId,
            @RequestParam(value = "tenantCode", required = false) String tenantParam,
            @RequestParam(value = "companyId", required = false) Long companyParam
    ) {
        try {
            return service.downloadAttachment(
                    taskId,
                    tenantCode != null ? tenantCode : tenantParam,
                    companyId != null ? companyId : companyParam
            );
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
