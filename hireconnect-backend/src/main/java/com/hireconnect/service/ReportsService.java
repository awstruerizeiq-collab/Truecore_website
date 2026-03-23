package com.hireconnect.service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hireconnect.entity.ActivityLog;
import com.hireconnect.entity.Company;
import com.hireconnect.entity.User;
import com.hireconnect.repository.ActivityLogRepository;
import com.hireconnect.repository.CompanyRepository;
import com.hireconnect.repository.UserRepository;

@Service
public class ReportsService {

    private static final DateTimeFormatter MONTH_LABEL = DateTimeFormatter.ofPattern("MMM yyyy", Locale.ENGLISH);
    private static final DateTimeFormatter DATE_LABEL = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final ActivityLogRepository activityLogRepository;

    public ReportsService(
            CompanyRepository companyRepository,
            UserRepository userRepository,
            ActivityLogRepository activityLogRepository) {
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
        this.activityLogRepository = activityLogRepository;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getOverview(LocalDate from, LocalDate to, Long companyId, String plan) {
        List<Company> companies = filterCompanies(from, to, companyId, plan);
        List<User> users = filterUsers(companyId, from, to);

        int totalCompanies = companies.size();
        int totalEmployees = companies.stream().map(Company::getEmployees).filter(Objects::nonNull).mapToInt(Integer::intValue).sum();
        long activeUsers = users.stream()
                .filter(u -> u.getStatus() == User.Status.ACTIVE)
                .count();
        long totalSubscriptions = companies.stream()
                .filter(c -> c.getPlan() != null && !c.getPlan().isBlank())
                .count();
        BigDecimal revenue = companies.stream()
                .map(this::estimateMonthlyRevenue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        LocalDate firstOfMonth = LocalDate.now().withDayOfMonth(1);
        long newRegistrationsThisMonth = companies.stream()
                .filter(c -> c.getCreatedDate() != null && !c.getCreatedDate().isBefore(firstOfMonth))
                .count();

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("totalCompanies", totalCompanies);
        data.put("totalEmployees", totalEmployees);
        data.put("activeUsers", activeUsers);
        data.put("totalSubscriptions", totalSubscriptions);
        data.put("revenueOverview", revenue);
        data.put("newRegistrationsThisMonth", newRegistrationsThisMonth);
        return data;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getMonthlyGrowth(LocalDate from, LocalDate to, Long companyId, String plan) {
        List<Company> companies = filterCompanies(from, to, companyId, plan);
        Map<YearMonth, Long> grouped = companies.stream()
                .map(c -> c.getCreatedDate() != null ? c.getCreatedDate() : c.getStartDate())
                .filter(Objects::nonNull)
                .map(YearMonth::from)
                .collect(Collectors.groupingBy(v -> v, Collectors.counting()));

        return grouped.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(e -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("month", e.getKey().format(MONTH_LABEL));
                    row.put("value", e.getValue());
                    return row;
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getRevenue(LocalDate from, LocalDate to, Long companyId, String plan) {
        List<Company> companies = filterCompanies(from, to, companyId, plan);
        Map<YearMonth, BigDecimal> grouped = new HashMap<>();
        for (Company company : companies) {
            LocalDate sourceDate = company.getStartDate() != null ? company.getStartDate() : company.getCreatedDate();
            if (sourceDate == null) {
                continue;
            }
            YearMonth ym = YearMonth.from(sourceDate);
            grouped.put(ym, grouped.getOrDefault(ym, BigDecimal.ZERO).add(estimateMonthlyRevenue(company)));
        }

        return grouped.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(e -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("month", e.getKey().format(MONTH_LABEL));
                    row.put("value", e.getValue());
                    return row;
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getEmployeeDistribution(LocalDate from, LocalDate to, Long companyId, String plan) {
        List<Company> companies = filterCompanies(from, to, companyId, plan);
        return companies.stream()
                .map(c -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("name", c.getDisplayName());
                    row.put("value", c.getEmployees() == null ? 0 : c.getEmployees());
                    return row;
                })
                .sorted((a, b) -> Integer.compare((int) b.get("value"), (int) a.get("value")))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getSubscriptionDistribution(LocalDate from, LocalDate to, Long companyId, String plan) {
        List<Company> companies = filterCompanies(from, to, companyId, plan);
        Map<String, Long> grouped = companies.stream()
                .collect(Collectors.groupingBy(c -> normalizePlan(c.getPlan()), Collectors.counting()));

        return grouped.entrySet().stream()
                .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                .map(e -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("name", e.getKey());
                    row.put("value", e.getValue());
                    return row;
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getTop5CompaniesByRevenue(LocalDate from, LocalDate to, String plan) {
        return filterCompanies(from, to, null, plan).stream()
                .map(c -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("companyId", c.getId());
                    row.put("name", c.getDisplayName());
                    row.put("value", estimateMonthlyRevenue(c));
                    return row;
                })
                .sorted((a, b) -> ((BigDecimal) b.get("value")).compareTo((BigDecimal) a.get("value")))
                .limit(5)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getTop5ActiveCompanies(LocalDate from, LocalDate to, String plan) {
        List<Company> companies = filterCompanies(from, to, null, plan);
        Map<Long, Long> activeByCompany = userRepository.findAll().stream()
                .filter(u -> u.getCompanyId() != null && u.getDeletedAt() == null && u.getStatus() == User.Status.ACTIVE)
                .collect(Collectors.groupingBy(User::getCompanyId, Collectors.counting()));

        return companies.stream()
                .map(c -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("companyId", c.getId());
                    row.put("name", c.getDisplayName());
                    row.put("value", activeByCompany.getOrDefault(c.getId(), 0L));
                    return row;
                })
                .sorted((a, b) -> Long.compare((Long) b.get("value"), (Long) a.get("value")))
                .limit(5)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getEmployeeGrowthTrend(LocalDate from, LocalDate to, Long companyId) {
        List<User> users = filterUsers(companyId, from, to);
        Map<YearMonth, Long> grouped = users.stream()
                .filter(u -> u.getRole() == User.Role.EMPLOYEE)
                .map(User::getCreatedAt)
                .filter(Objects::nonNull)
                .map(YearMonth::from)
                .collect(Collectors.groupingBy(v -> v, Collectors.counting()));

        return grouped.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(e -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("month", e.getKey().format(MONTH_LABEL));
                    row.put("value", e.getValue());
                    return row;
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getAdminActivityLogs(LocalDate from, LocalDate to, Integer page, Integer size) {
        int safePage = page == null || page < 0 ? 0 : page;
        int safeSize = size == null || size <= 0 ? 20 : Math.min(size, 100);
        Pageable pageable = PageRequest.of(safePage, safeSize);

        Page<ActivityLog> logsPage;
        if (from != null || to != null) {
            LocalDateTime fromTs = from != null ? from.atStartOfDay() : LocalDate.MIN.atStartOfDay();
            LocalDateTime toTs = to != null ? to.plusDays(1).atStartOfDay().minusNanos(1) : LocalDate.MAX.atStartOfDay();
            logsPage = activityLogRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(fromTs, toTs, pageable);
        } else {
            logsPage = activityLogRepository.findAllByOrderByCreatedAtDesc(pageable);
        }

        List<Map<String, Object>> rows = logsPage.getContent().stream().map(log -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", log.getId());
            row.put("eventType", log.getEventType());
            row.put("message", log.getMessage());
            row.put("severity", log.getSeverity());
            row.put("tag", log.getTag());
            row.put("companyId", log.getCompanyId());
            row.put("tenantCode", log.getTenantCode());
            row.put("actorUserId", log.getActorUserId());
            row.put("actorName", log.getActorName());
            row.put("createdAt", log.getCreatedAt());
            return row;
        }).collect(Collectors.toList());

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("items", rows);
        data.put("page", logsPage.getNumber());
        data.put("size", logsPage.getSize());
        data.put("totalElements", logsPage.getTotalElements());
        data.put("totalPages", logsPage.getTotalPages());
        return data;
    }

    @Transactional(readOnly = true)
    public byte[] exportCsv(LocalDate from, LocalDate to, Long companyId, String plan) {
        List<Company> companies = filterCompanies(from, to, companyId, plan);
        StringBuilder csv = new StringBuilder();
        csv.append("CompanyId,CompanyName,Plan,BillingCycle,Employees,Status,EstimatedMonthlyRevenue,CreatedDate\n");
        for (Company c : companies) {
            csv.append(c.getId()).append(",");
            csv.append(escapeCsv(c.getDisplayName())).append(",");
            csv.append(escapeCsv(normalizePlan(c.getPlan()))).append(",");
            csv.append(escapeCsv(c.getBillingCycle())).append(",");
            csv.append(c.getEmployees() == null ? 0 : c.getEmployees()).append(",");
            csv.append(escapeCsv(c.getStatus())).append(",");
            csv.append(estimateMonthlyRevenue(c)).append(",");
            csv.append(c.getCreatedDate() == null ? "" : c.getCreatedDate().format(DATE_LABEL)).append("\n");
        }
        return csv.toString().getBytes();
    }

    @Transactional(readOnly = true)
    public byte[] exportPdf(LocalDate from, LocalDate to, Long companyId, String plan) {
        List<Company> companies = filterCompanies(from, to, companyId, plan);
        Map<String, Object> overview = getOverview(from, to, companyId, plan);

        try (PDDocument document = new PDDocument(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);

            try (PDPageContentStream content = new PDPageContentStream(document, page)) {
                float y = 790;
                content.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 15);
                content.beginText();
                content.newLineAtOffset(50, y);
                content.showText("TrueCoreHR Reports & Analytics");
                content.endText();

                y -= 24;
                content.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 10);
                content.beginText();
                content.newLineAtOffset(50, y);
                content.showText("Generated at: " + LocalDateTime.now());
                content.endText();

                y -= 20;
                for (Map.Entry<String, Object> entry : overview.entrySet()) {
                    content.beginText();
                    content.newLineAtOffset(50, y);
                    content.showText(entry.getKey() + ": " + String.valueOf(entry.getValue()));
                    content.endText();
                    y -= 14;
                }

                y -= 6;
                content.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 11);
                content.beginText();
                content.newLineAtOffset(50, y);
                content.showText("Top Companies Snapshot");
                content.endText();
                y -= 16;

                List<Company> top = companies.stream()
                        .sorted(Comparator.comparing(this::estimateMonthlyRevenue).reversed())
                        .limit(15)
                        .collect(Collectors.toList());

                content.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 9);
                for (Company c : top) {
                    if (y < 60) {
                        break;
                    }
                    String row = String.format(
                            "%s | %s | Emp:%d | Revenue:%s",
                            safe(c.getDisplayName()),
                            normalizePlan(c.getPlan()),
                            c.getEmployees() == null ? 0 : c.getEmployees(),
                            estimateMonthlyRevenue(c).toPlainString());
                    content.beginText();
                    content.newLineAtOffset(50, y);
                    content.showText(row);
                    content.endText();
                    y -= 12;
                }
            }

            document.save(out);
            return out.toByteArray();
        } catch (Exception ex) {
            throw new RuntimeException("Failed to generate PDF report", ex);
        }
    }

    private List<Company> filterCompanies(LocalDate from, LocalDate to, Long companyId, String plan) {
        return companyRepository.findAll().stream()
                .filter(c -> companyId == null || Objects.equals(c.getId(), companyId))
                .filter(c -> plan == null || plan.isBlank() || normalizePlan(c.getPlan()).equalsIgnoreCase(plan.trim()))
                .filter(c -> {
                    LocalDate d = c.getCreatedDate() != null ? c.getCreatedDate() : c.getStartDate();
                    if (d == null) {
                        return true;
                    }
                    if (from != null && d.isBefore(from)) {
                        return false;
                    }
                    if (to != null && d.isAfter(to)) {
                        return false;
                    }
                    return true;
                })
                .collect(Collectors.toList());
    }

    private List<User> filterUsers(Long companyId, LocalDate from, LocalDate to) {
        return userRepository.findAll().stream()
                .filter(u -> u.getDeletedAt() == null)
                .filter(u -> companyId == null || Objects.equals(u.getCompanyId(), companyId))
                .filter(u -> {
                    if (u.getCreatedAt() == null) {
                        return true;
                    }
                    LocalDate d = u.getCreatedAt().toLocalDate();
                    if (from != null && d.isBefore(from)) {
                        return false;
                    }
                    if (to != null && d.isAfter(to)) {
                        return false;
                    }
                    return true;
                })
                .collect(Collectors.toList());
    }

    private BigDecimal estimateMonthlyRevenue(Company company) {
        String plan = normalizePlan(company.getPlan()).toLowerCase(Locale.ENGLISH);
        BigDecimal monthly;
        switch (plan) {
            case "starter":
            case "basic":
                monthly = BigDecimal.valueOf(29);
                break;
            case "professional":
            case "growth":
                monthly = BigDecimal.valueOf(59);
                break;
            case "scale":
                monthly = BigDecimal.valueOf(99);
                break;
            case "enterprise":
                monthly = BigDecimal.valueOf(199);
                break;
            default:
                monthly = BigDecimal.ZERO;
                break;
        }
        return monthly.setScale(2, RoundingMode.HALF_UP);
    }

    private String normalizePlan(String plan) {
        if (plan == null || plan.isBlank()) {
            return "Unknown";
        }
        return plan.trim();
    }

    private String safe(String value) {
        return value == null ? "-" : value;
    }

    private String escapeCsv(String value) {
        String v = value == null ? "" : value;
        return "\"" + v.replace("\"", "\"\"") + "\"";
    }
}
