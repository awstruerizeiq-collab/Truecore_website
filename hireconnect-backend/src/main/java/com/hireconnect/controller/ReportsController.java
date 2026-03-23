package com.hireconnect.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.hireconnect.dto.response.ApiResponse;
import com.hireconnect.service.GlobalAdminAccessService;
import com.hireconnect.service.ReportsService;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "*")
public class ReportsController {

    private final ReportsService reportsService;
    private final GlobalAdminAccessService globalAdminAccessService;

    public ReportsController(
            ReportsService reportsService,
            GlobalAdminAccessService globalAdminAccessService) {
        this.reportsService = reportsService;
        this.globalAdminAccessService = globalAdminAccessService;
    }

    @GetMapping("/overview")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getOverview(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(value = "from", required = false) LocalDate from,
            @RequestParam(value = "to", required = false) LocalDate to,
            @RequestParam(value = "companyId", required = false) Long companyId,
            @RequestParam(value = "plan", required = false) String plan) {
        try {
            validateGlobalAdmin(authHeader);
            Map<String, Object> data = reportsService.getOverview(from, to, companyId, plan);
            return ResponseEntity.ok(ApiResponse.success("Overview fetched", data));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/monthly-growth")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getMonthlyGrowth(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(value = "from", required = false) LocalDate from,
            @RequestParam(value = "to", required = false) LocalDate to,
            @RequestParam(value = "companyId", required = false) Long companyId,
            @RequestParam(value = "plan", required = false) String plan) {
        try {
            validateGlobalAdmin(authHeader);
            List<Map<String, Object>> data = reportsService.getMonthlyGrowth(from, to, companyId, plan);
            return ResponseEntity.ok(ApiResponse.success("Monthly growth fetched", data));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/revenue")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getRevenue(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(value = "from", required = false) LocalDate from,
            @RequestParam(value = "to", required = false) LocalDate to,
            @RequestParam(value = "companyId", required = false) Long companyId,
            @RequestParam(value = "plan", required = false) String plan) {
        try {
            validateGlobalAdmin(authHeader);
            List<Map<String, Object>> data = reportsService.getRevenue(from, to, companyId, plan);
            return ResponseEntity.ok(ApiResponse.success("Revenue trend fetched", data));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/employee-distribution")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getEmployeeDistribution(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(value = "from", required = false) LocalDate from,
            @RequestParam(value = "to", required = false) LocalDate to,
            @RequestParam(value = "companyId", required = false) Long companyId,
            @RequestParam(value = "plan", required = false) String plan) {
        try {
            validateGlobalAdmin(authHeader);
            List<Map<String, Object>> data = reportsService.getEmployeeDistribution(from, to, companyId, plan);
            return ResponseEntity.ok(ApiResponse.success("Employee distribution fetched", data));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/subscription-distribution")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getSubscriptionDistribution(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(value = "from", required = false) LocalDate from,
            @RequestParam(value = "to", required = false) LocalDate to,
            @RequestParam(value = "companyId", required = false) Long companyId,
            @RequestParam(value = "plan", required = false) String plan) {
        try {
            validateGlobalAdmin(authHeader);
            List<Map<String, Object>> data = reportsService.getSubscriptionDistribution(from, to, companyId, plan);
            return ResponseEntity.ok(ApiResponse.success("Subscription distribution fetched", data));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/top-companies-revenue")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getTopCompaniesRevenue(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(value = "from", required = false) LocalDate from,
            @RequestParam(value = "to", required = false) LocalDate to,
            @RequestParam(value = "plan", required = false) String plan) {
        try {
            validateGlobalAdmin(authHeader);
            List<Map<String, Object>> data = reportsService.getTop5CompaniesByRevenue(from, to, plan);
            return ResponseEntity.ok(ApiResponse.success("Top revenue companies fetched", data));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/top-active-companies")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getTopActiveCompanies(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(value = "from", required = false) LocalDate from,
            @RequestParam(value = "to", required = false) LocalDate to,
            @RequestParam(value = "plan", required = false) String plan) {
        try {
            validateGlobalAdmin(authHeader);
            List<Map<String, Object>> data = reportsService.getTop5ActiveCompanies(from, to, plan);
            return ResponseEntity.ok(ApiResponse.success("Top active companies fetched", data));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/employee-growth")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getEmployeeGrowth(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(value = "from", required = false) LocalDate from,
            @RequestParam(value = "to", required = false) LocalDate to,
            @RequestParam(value = "companyId", required = false) Long companyId) {
        try {
            validateGlobalAdmin(authHeader);
            List<Map<String, Object>> data = reportsService.getEmployeeGrowthTrend(from, to, companyId);
            return ResponseEntity.ok(ApiResponse.success("Employee growth trend fetched", data));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/activity-logs")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getActivityLogs(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(value = "from", required = false) LocalDate from,
            @RequestParam(value = "to", required = false) LocalDate to,
            @RequestParam(value = "page", required = false) Integer page,
            @RequestParam(value = "size", required = false) Integer size) {
        try {
            validateGlobalAdmin(authHeader);
            Map<String, Object> data = reportsService.getAdminActivityLogs(from, to, page, size);
            return ResponseEntity.ok(ApiResponse.success("Activity logs fetched", data));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/export/csv")
    public ResponseEntity<byte[]> exportCsv(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(value = "from", required = false) LocalDate from,
            @RequestParam(value = "to", required = false) LocalDate to,
            @RequestParam(value = "companyId", required = false) Long companyId,
            @RequestParam(value = "plan", required = false) String plan) {
        try {
            validateGlobalAdmin(authHeader);
            byte[] bytes = reportsService.exportCsv(from, to, companyId, plan);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.TEXT_PLAIN);
            headers.setContentDisposition(ContentDisposition.attachment().filename("truecorehr-reports.csv").build());
            return ResponseEntity.ok().headers(headers).body(bytes);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/export/pdf")
    public ResponseEntity<byte[]> exportPdf(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(value = "from", required = false) LocalDate from,
            @RequestParam(value = "to", required = false) LocalDate to,
            @RequestParam(value = "companyId", required = false) Long companyId,
            @RequestParam(value = "plan", required = false) String plan) {
        try {
            validateGlobalAdmin(authHeader);
            byte[] bytes = reportsService.exportPdf(from, to, companyId, plan);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDisposition(ContentDisposition.attachment().filename("truecorehr-reports.pdf").build());
            return ResponseEntity.ok().headers(headers).body(bytes);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    private String validateGlobalAdmin(String authHeader) {
        return globalAdminAccessService.validate(authHeader, "Only Global Admin can access reports");
    }
}

