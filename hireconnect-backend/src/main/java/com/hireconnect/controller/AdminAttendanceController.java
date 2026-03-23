package com.hireconnect.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.hireconnect.dto.request.EarnedLeaveMonthUpdateRequest;
import com.hireconnect.dto.request.EarnedLeaveQuarterUpdateRequest;
import com.hireconnect.dto.request.ManualAttendanceRequest;
import com.hireconnect.dto.response.ApiResponse;
import com.hireconnect.dto.response.DashboardStatsResponse;
import com.hireconnect.service.AdminAttendanceService;
import com.hireconnect.service.EarnedLeaveService;

@RestController
@RequestMapping("/api/admin/attendance")
@CrossOrigin(origins = "*")
public class AdminAttendanceController {

    private final AdminAttendanceService adminAttendanceService;
    private final EarnedLeaveService earnedLeaveService;

    public AdminAttendanceController(
            AdminAttendanceService adminAttendanceService,
            EarnedLeaveService earnedLeaveService
    ) {
        this.adminAttendanceService = adminAttendanceService;
        this.earnedLeaveService = earnedLeaveService;
    }

    @GetMapping("/dashboard-stats")
    public ResponseEntity<ApiResponse<DashboardStatsResponse>> getDashboardStats(
            @RequestHeader(value = "X-Tenant-Code", required = false) String tenantHeader,
            @RequestHeader(value = "X-Company-Id", required = false) String companyHeader,
            @RequestParam(value = "tenantCode", required = false) String tenantParam,
            @RequestParam(value = "companyId", required = false) String companyParam
    ) {
        DashboardStatsResponse stats = adminAttendanceService.getDashboardStats(
                resolveTenantCode(tenantHeader, tenantParam),
                resolveCompanyId(companyHeader, companyParam)
        );
        return ResponseEntity.ok(ApiResponse.success("Dashboard stats fetched", stats));
    }

    @GetMapping("/live")
    public ResponseEntity<ApiResponse<?>> getLiveAttendance(
            @RequestHeader(value = "X-Tenant-Code", required = false) String tenantHeader,
            @RequestHeader(value = "X-Company-Id", required = false) String companyHeader,
            @RequestParam(value = "tenantCode", required = false) String tenantParam,
            @RequestParam(value = "companyId", required = false) String companyParam
    ) {
        var liveData = adminAttendanceService.getLiveAttendance(
                resolveTenantCode(tenantHeader, tenantParam),
                resolveCompanyId(companyHeader, companyParam)
        );
        return ResponseEntity.ok(ApiResponse.success("Live attendance fetched", liveData));
    }

    @GetMapping("/live-employees")
    public ResponseEntity<ApiResponse<?>> getLiveAttendanceAlias(
            @RequestHeader(value = "X-Tenant-Code", required = false) String tenantHeader,
            @RequestHeader(value = "X-Company-Id", required = false) String companyHeader,
            @RequestParam(value = "tenantCode", required = false) String tenantParam,
            @RequestParam(value = "companyId", required = false) String companyParam
    ) {
        return getLiveAttendance(tenantHeader, companyHeader, tenantParam, companyParam);
    }

    @GetMapping("/timesheets")
    public ResponseEntity<ApiResponse<?>> getTimesheets(
            @RequestHeader(value = "X-Tenant-Code", required = false) String tenantHeader,
            @RequestHeader(value = "X-Company-Id", required = false) String companyHeader,
            @RequestParam(value = "tenantCode", required = false) String tenantParam,
            @RequestParam(value = "companyId", required = false) String companyParam
    ) {
        var timesheets = adminAttendanceService.getTimesheets(
                resolveTenantCode(tenantHeader, tenantParam),
                resolveCompanyId(companyHeader, companyParam)
        );
        return ResponseEntity.ok(ApiResponse.success("Timesheets fetched", timesheets));
    }

    @PostMapping("/apply-manual-attendance/{employeeId}")
    public ResponseEntity<ApiResponse<String>> applyManualAttendance(
            @PathVariable Long employeeId,
            @RequestBody ManualAttendanceRequest request
    ) {
        adminAttendanceService.applyManualAttendance(employeeId, request);
        return ResponseEntity.ok(ApiResponse.success("Manual attendance applied successfully", null));
    }

    @PutMapping("/update-manual-attendance/{employeeId}")
    public ResponseEntity<ApiResponse<String>> updateManualAttendance(
            @PathVariable Long employeeId,
            @RequestBody ManualAttendanceRequest request
    ) {
        adminAttendanceService.updateManualAttendance(employeeId, request);
        return ResponseEntity.ok(ApiResponse.success("Attendance updated successfully", null));
    }

    @GetMapping("/earned-leave-settings")
    public ResponseEntity<ApiResponse<?>> getEarnedLeaveSettings(
            @RequestHeader(value = "X-Tenant-Code", required = false) String tenantHeader,
            @RequestHeader(value = "X-Company-Id", required = false) String companyHeader,
            @RequestParam(value = "tenantCode", required = false) String tenantParam,
            @RequestParam(value = "companyId", required = false) String companyParam,
            @RequestParam(value = "year", required = false) Integer year
    ) {
        var data = earnedLeaveService.getQuarterSettings(
                resolveTenantCode(tenantHeader, tenantParam),
                resolveCompanyId(companyHeader, companyParam),
                year
        );
        return ResponseEntity.ok(ApiResponse.success("Earned leave settings fetched", data));
    }

    @PutMapping("/earned-leave-settings/month/{month}")
    public ResponseEntity<ApiResponse<?>> updateEarnedLeaveMonth(
            @PathVariable Integer month,
            @RequestHeader(value = "X-Tenant-Code", required = false) String tenantHeader,
            @RequestHeader(value = "X-Company-Id", required = false) String companyHeader,
            @RequestParam(value = "tenantCode", required = false) String tenantParam,
            @RequestParam(value = "companyId", required = false) String companyParam,
            @RequestParam(value = "year", required = false) Integer year,
            @RequestBody EarnedLeaveMonthUpdateRequest request
    ) {
        var data = earnedLeaveService.updateMonthValue(
                resolveTenantCode(tenantHeader, tenantParam),
                resolveCompanyId(companyHeader, companyParam),
                year,
                month,
                request == null ? null : request.getValue()
        );
        return ResponseEntity.ok(ApiResponse.success("Earned leave month updated", data));
    }

    @PutMapping("/earned-leave-settings/quarter")
    public ResponseEntity<ApiResponse<?>> updateEarnedLeaveQuarter(
            @RequestHeader(value = "X-Tenant-Code", required = false) String tenantHeader,
            @RequestHeader(value = "X-Company-Id", required = false) String companyHeader,
            @RequestParam(value = "tenantCode", required = false) String tenantParam,
            @RequestParam(value = "companyId", required = false) String companyParam,
            @RequestBody EarnedLeaveQuarterUpdateRequest request
    ) {
        var data = earnedLeaveService.updateQuarterValues(
                resolveTenantCode(tenantHeader, tenantParam),
                resolveCompanyId(companyHeader, companyParam),
                request == null ? null : request.getYear(),
                request == null ? null : request.getQuarter(),
                request == null ? null : request.getMonthValues()
        );
        return ResponseEntity.ok(ApiResponse.success("Earned leave quarter updated", data));
    }

    @GetMapping("/earned-leave-balance/{employeeId}")
    public ResponseEntity<ApiResponse<?>> getEmployeeEarnedLeaveBalance(
            @PathVariable Long employeeId,
            @RequestParam(value = "year", required = false) Integer year
    ) {
        Double balance = earnedLeaveService.getEmployeeBalance(employeeId, year);
        return ResponseEntity.ok(ApiResponse.success("Earned leave balance fetched", balance));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<?>> getAllTimesheets() {
        return ResponseEntity.ok(
                ApiResponse.success("Timesheets fetched successfully", adminAttendanceService.getAllTimesheets())
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> getTimesheetById(@PathVariable Long id) {
        return ResponseEntity.ok(
                ApiResponse.success("Timesheet fetched successfully", adminAttendanceService.getTimesheetById(id))
        );
    }

    @PutMapping("/timesheets/{id}")
    public ResponseEntity<ApiResponse<?>> updateTimesheet(
            @PathVariable Long id,
            @RequestBody Map<String, String> updates
    ) {
        String task = updates == null ? null : updates.get("task");
        String remarks = updates == null ? null : updates.get("remarks");
        return ResponseEntity.ok(
                ApiResponse.success(
                        "Timesheet updated successfully",
                        adminAttendanceService.updateTimesheet(id, task, remarks)
                )
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> deleteTimesheet(@PathVariable Long id) {
        adminAttendanceService.deleteTimesheet(id);
        return ResponseEntity.ok(ApiResponse.success("Timesheet deleted successfully", null));
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<ApiResponse<?>> getTimesheetsByEmployee(@PathVariable Long employeeId) {
        return ResponseEntity.ok(
                ApiResponse.success(
                        "Employee timesheets fetched successfully",
                        adminAttendanceService.getTimesheetsByEmployee(employeeId)
                )
        );
    }

    private String resolveTenantCode(String tenantHeader, String tenantParam) {
        String tenantCode = hasText(tenantHeader) ? tenantHeader.trim() : tenantParam;
        if (!hasText(tenantCode)) {
            throw new RuntimeException("tenantCode is required");
        }
        return tenantCode.trim();
    }

    private Long resolveCompanyId(String companyHeader, String companyParam) {
        String raw = hasText(companyHeader) ? companyHeader.trim() : companyParam;
        if (!hasText(raw)) {
            throw new RuntimeException("companyId is required");
        }
        try {
            return Long.valueOf(raw.trim());
        } catch (NumberFormatException ex) {
            throw new RuntimeException("companyId must be a valid number");
        }
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
