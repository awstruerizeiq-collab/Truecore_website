package com.hireconnect.service;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoField;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.hwpf.HWPFDocument;
import org.apache.poi.hwpf.extractor.WordExtractor;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.DateUtil;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import com.hireconnect.dto.request.HolidayRequest;
import com.hireconnect.dto.response.HolidayFileImportResponse;
import com.hireconnect.dto.response.HolidayResponse;
import com.hireconnect.dto.response.HolidayUpdateFileResponse;
import com.hireconnect.entity.Holiday;
import com.hireconnect.entity.HolidayUpdateFile;
import com.hireconnect.entity.User;
import com.hireconnect.repository.HolidayRepository;
import com.hireconnect.repository.HolidayUpdateFileRepository;

@Service
public class HolidayService {

    private static final Set<String> ALLOWED_FILE_TYPES = Set.of("doc", "docx", "pdf", "xls", "xlsx");
    private static final String HOLIDAY_UPLOAD_DIR = "uploads/holiday-updates";
    private static final Pattern DATE_TOKEN_PATTERN = Pattern.compile(
        "(\\b\\d{1,2}[/-]\\d{1,2}[/-]\\d{2,4}\\b)|" +
        "(\\b\\d{4}[/-]\\d{1,2}[/-]\\d{1,2}\\b)|" +
        "(\\b\\d{1,2}\\s+[A-Za-z]{3,9}\\s+\\d{2,4}\\b)|" +
        "(\\b[A-Za-z]{3,9}\\s+\\d{1,2},\\s*\\d{2,4}\\b)|" +
        "(\\b\\d{1,2}[/-]\\d{1,2}\\b)|" +
        "(\\b\\d{1,2}\\s+[A-Za-z]{3,9}\\b)|" +
        "(\\b[A-Za-z]{3,9}\\s+\\d{1,2}\\b)"
    );
    private static final Pattern YEAR_PATTERN = Pattern.compile("\\b(20\\d{2})\\b");
    private static final List<DateTimeFormatter> DATE_FORMATTERS = List.of(
        formatter("d/M/uuuu"),
        formatter("d-M-uuuu"),
        formatter("d.M.uuuu"),
        formatter("uuuu-M-d"),
        formatter("uuuu/M/d"),
        formatter("d MMM uuuu"),
        formatter("d MMMM uuuu"),
        formatter("MMM d, uuuu"),
        formatter("MMMM d, uuuu")
    );

    private final HolidayRepository holidayRepository;
    private final HolidayUpdateFileRepository holidayUpdateFileRepository;
    private final UserService userService;
    private final HolidayUpdatePublisher holidayUpdatePublisher;

    public HolidayService(
        HolidayRepository holidayRepository,
        HolidayUpdateFileRepository holidayUpdateFileRepository,
        UserService userService,
        HolidayUpdatePublisher holidayUpdatePublisher
    ) {
        this.holidayRepository = holidayRepository;
        this.holidayUpdateFileRepository = holidayUpdateFileRepository;
        this.userService = userService;
        this.holidayUpdatePublisher = holidayUpdatePublisher;
    }

    public List<Holiday> getHolidays(String tenantCode, Long companyId) {
        validateContext(tenantCode, companyId);
        return holidayRepository.findByTenantCodeAndCompanyIdOrderByDateAsc(tenantCode, companyId);
    }

    public List<HolidayResponse> getHolidays(String tenantCode, Long companyId, Integer year, Integer month) {
        validateContext(tenantCode, companyId);

        List<Holiday> holidays;
        if (year != null && month != null) {
            LocalDate start = LocalDate.of(year, month, 1);
            LocalDate end = start.withDayOfMonth(start.lengthOfMonth());
            holidays = holidayRepository.findByTenantCodeAndCompanyIdAndDateBetweenOrderByDateAsc(
                tenantCode,
                companyId,
                start,
                end
            );
        } else {
            holidays = getHolidays(tenantCode, companyId);
        }

        return holidays.stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<Holiday> getHolidaysForRange(String tenantCode, Long companyId, LocalDate startDate, LocalDate endDate) {
        validateContext(tenantCode, companyId);
        if (startDate == null || endDate == null) {
            throw new RuntimeException("startDate and endDate are required");
        }
        return holidayRepository.findByTenantCodeAndCompanyIdAndDateBetweenOrderByDateAsc(
            tenantCode,
            companyId,
            startDate,
            endDate
        );
    }

    public Map<LocalDate, Holiday> getHolidayMapForMonth(
        String tenantCode,
        Long companyId,
        LocalDate startDate,
        LocalDate endDate
    ) {
        Map<LocalDate, Holiday> map = new LinkedHashMap<>();
        for (Holiday holiday : getHolidaysForRange(tenantCode, companyId, startDate, endDate)) {
            map.putIfAbsent(holiday.getDate(), holiday);
        }
        return map;
    }

    public boolean exists(String tenantCode, Long companyId, String name, LocalDate date) {
        validateContext(tenantCode, companyId);
        if (!StringUtils.hasText(name) || date == null) {
            return false;
        }
        return holidayRepository.existsByTenantCodeAndCompanyIdAndNameIgnoreCaseAndDate(
            tenantCode,
            companyId,
            name.trim(),
            date
        );
    }

    @Transactional
    public Holiday createHoliday(String tenantCode, Long companyId, HolidayRequest request) {
        validateContext(tenantCode, companyId);
        validateRequest(request);

        Holiday holiday = new Holiday();
        holiday.setName(request.getName().trim());
        holiday.setDate(request.getDate());
        holiday.setTagsCsv(normalizeTagsCsv(request.getTags()));
        holiday.setTenantCode(tenantCode);
        holiday.setCompanyId(companyId);

        Holiday saved = holidayRepository.save(holiday);
        notifySubscribers(tenantCode, companyId);
        return saved;
    }

    @Transactional
    public HolidayResponse createHoliday(HolidayRequest request, String tenantCode, Long companyId) {
        return toResponse(createHoliday(tenantCode, companyId, request));
    }

    @Transactional
    public Holiday updateHoliday(Long id, String tenantCode, Long companyId, HolidayRequest request) {
        validateContext(tenantCode, companyId);
        validateRequest(request);

        Holiday holiday = holidayRepository.findByIdAndTenantCodeAndCompanyId(id, tenantCode, companyId)
            .orElseThrow(() -> new RuntimeException("Holiday not found"));

        holiday.setName(request.getName().trim());
        holiday.setDate(request.getDate());
        holiday.setTagsCsv(normalizeTagsCsv(request.getTags()));

        Holiday saved = holidayRepository.save(holiday);
        notifySubscribers(tenantCode, companyId);
        return saved;
    }

    @Transactional
    public HolidayResponse updateHoliday(Long id, HolidayRequest request, String tenantCode, Long companyId) {
        return toResponse(updateHoliday(id, tenantCode, companyId, request));
    }

    @Transactional
    public void deleteHoliday(Long id, String tenantCode, Long companyId) {
        validateContext(tenantCode, companyId);
        Holiday holiday = holidayRepository.findByIdAndTenantCodeAndCompanyId(id, tenantCode, companyId)
            .orElseThrow(() -> new RuntimeException("Holiday not found"));
        holidayRepository.delete(holiday);
        notifySubscribers(tenantCode, companyId);
    }

    public List<HolidayUpdateFileResponse> getHolidayFiles(String tenantCode, Long companyId) {
        validateContext(tenantCode, companyId);
        return holidayUpdateFileRepository.findByTenantCodeAndCompanyIdOrderByUploadedAtDesc(tenantCode, companyId)
            .stream()
            .map(this::toFileResponse)
            .collect(Collectors.toList());
    }

    @Transactional
    public HolidayFileImportResponse uploadHolidayFile(MultipartFile file, String tenantCode, Long companyId) {
        validateContext(tenantCode, companyId);
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("Please select a file to upload");
        }

        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename() == null ? "" : file.getOriginalFilename());
        if (!StringUtils.hasText(originalFilename) || originalFilename.contains("..")) {
            throw new RuntimeException("Invalid file name");
        }

        String safeFilename = Paths.get(originalFilename).getFileName().toString();
        String extension = getFileExtension(safeFilename).toLowerCase(Locale.ENGLISH);
        if (!ALLOWED_FILE_TYPES.contains(extension)) {
            throw new RuntimeException("Invalid file type. Only DOC, DOCX, PDF, XLS, XLSX are allowed.");
        }

        String storedFileName = UUID.randomUUID() + "_" + safeFilename.replaceAll("\\s+", "_");
        File uploadDir = ensureHolidayUploadDirectory();
        Path destination = uploadDir.toPath().resolve(storedFileName);

        try {
            file.transferTo(destination);
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file: " + e.getMessage(), e);
        }

        User currentUser;
        try {
            currentUser = userService.getCurrentUser();
        } catch (Exception ignored) {
            currentUser = null;
        }

        HolidayUpdateFile fileEntity = new HolidayUpdateFile();
        fileEntity.setFileName(storedFileName);
        fileEntity.setOriginalFileName(safeFilename);
        fileEntity.setFileType(extension.toUpperCase(Locale.ENGLISH));
        fileEntity.setFilePath(destination.toString());
        fileEntity.setFileUrl("/uploads/holiday-updates/" + storedFileName);
        fileEntity.setUploadedBy(resolveUploadedBy(currentUser));
        fileEntity.setTenantCode(tenantCode);
        fileEntity.setCompanyId(companyId);

        HolidayUpdateFile savedFile = holidayUpdateFileRepository.save(fileEntity);
        List<HolidayResponse> imported = importParsedHolidays(file, extension, inferYear(safeFilename), tenantCode, companyId);

        HolidayFileImportResponse response = new HolidayFileImportResponse();
        response.setFile(toFileResponse(savedFile));
        response.setImportedHolidays(imported);
        response.setImportedCount(imported.size());
        response.setDuplicateCount(0);
        response.setDuplicateMessages(Collections.emptyList());
        return response;
    }

    @Transactional
    public void deleteHolidayFile(Long id, String tenantCode, Long companyId) {
        validateContext(tenantCode, companyId);
        HolidayUpdateFile entity = holidayUpdateFileRepository.findByIdAndTenantCodeAndCompanyId(id, tenantCode, companyId)
            .orElseThrow(() -> new RuntimeException("Holiday file not found"));

        if (StringUtils.hasText(entity.getFilePath())) {
            try {
                Files.deleteIfExists(Paths.get(entity.getFilePath()));
            } catch (IOException ignored) {
                // Best effort.
            }
        }

        holidayUpdateFileRepository.delete(entity);
    }

    private List<HolidayResponse> importParsedHolidays(
        MultipartFile file,
        String extension,
        int defaultYear,
        String tenantCode,
        Long companyId
    ) {
        List<ParsedHoliday> parsed;
        try {
            parsed = parseUploadedHolidayFile(file, extension, defaultYear);
        } catch (Exception ignored) {
            parsed = Collections.emptyList();
        }

        List<HolidayResponse> imported = new ArrayList<>();
        for (ParsedHoliday row : parsed) {
            if (!StringUtils.hasText(row.name()) || row.date() == null || exists(tenantCode, companyId, row.name(), row.date())) {
                continue;
            }

            Holiday holiday = new Holiday();
            holiday.setName(row.name().trim());
            holiday.setDate(row.date());
            holiday.setTagsCsv("Imported");
            holiday.setTenantCode(tenantCode);
            holiday.setCompanyId(companyId);
            imported.add(toResponse(holidayRepository.save(holiday)));
        }

        if (!imported.isEmpty()) {
            notifySubscribers(tenantCode, companyId);
        }
        return imported;
    }

    private List<ParsedHoliday> parseUploadedHolidayFile(MultipartFile file, String extension, int defaultYear) throws IOException {
        if ("xls".equals(extension) || "xlsx".equals(extension)) {
            return parseExcelFile(file, defaultYear);
        }
        return parseTextFile(file, extension, defaultYear);
    }

    private List<ParsedHoliday> parseExcelFile(MultipartFile file, int defaultYear) throws IOException {
        List<ParsedHoliday> entries = new ArrayList<>();
        DataFormatter formatter = new DataFormatter();

        try (InputStream inputStream = file.getInputStream();
             Workbook workbook = WorkbookFactory.create(inputStream)) {
            for (Sheet sheet : workbook) {
                for (Row row : sheet) {
                    if (row == null) {
                        continue;
                    }
                    String name = formatter.formatCellValue(row.getCell(0)).trim();
                    String dateText = formatter.formatCellValue(row.getCell(1)).trim();
                    LocalDate date = parseDateFromCell(row.getCell(1), dateText, defaultYear);
                    if (StringUtils.hasText(name) && date != null) {
                        entries.add(new ParsedHoliday(name, date));
                    }
                }
            }
        }

        return entries;
    }

    private List<ParsedHoliday> parseTextFile(MultipartFile file, String extension, int defaultYear) throws IOException {
        String text;
        if ("pdf".equals(extension)) {
            try (PDDocument document = Loader.loadPDF(file.getBytes())) {
                text = new PDFTextStripper().getText(document);
            }
        } else if ("docx".equals(extension)) {
            try (XWPFDocument document = new XWPFDocument(file.getInputStream());
                 XWPFWordExtractor extractor = new XWPFWordExtractor(document)) {
                text = extractor.getText();
            }
        } else {
            try (HWPFDocument document = new HWPFDocument(file.getInputStream());
                 WordExtractor extractor = new WordExtractor(document)) {
                text = extractor.getText();
            }
        }

        List<ParsedHoliday> entries = new ArrayList<>();
        for (String line : text.split("\\r?\\n")) {
            String trimmed = String.valueOf(line).trim();
            if (!StringUtils.hasText(trimmed)) {
                continue;
            }

            String dateToken = extractDateToken(trimmed);
            if (!StringUtils.hasText(dateToken)) {
                continue;
            }

            LocalDate date = parseDateString(dateToken, defaultYear);
            String name = trimmed.replace(dateToken, "").replaceAll("[|,;:-]+", " ").replaceAll("\\s+", " ").trim();
            if (date != null && StringUtils.hasText(name)) {
                entries.add(new ParsedHoliday(name, date));
            }
        }
        return entries;
    }

    private void validateContext(String tenantCode, Long companyId) {
        if (!StringUtils.hasText(tenantCode)) {
            throw new RuntimeException("tenantCode is required");
        }
        if (companyId == null) {
            throw new RuntimeException("companyId is required");
        }
    }

    private void validateRequest(HolidayRequest request) {
        if (request == null) {
            throw new RuntimeException("Request body is required");
        }
        if (!StringUtils.hasText(request.getName())) {
            throw new RuntimeException("Holiday name is required");
        }
        if (request.getDate() == null) {
            throw new RuntimeException("Holiday date is required");
        }
    }

    private LocalDate parseDateFromCell(Cell cell, String fallbackText, int defaultYear) {
        if (cell != null && cell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cell)) {
            return cell.getLocalDateTimeCellValue().toLocalDate();
        }
        return parseDateString(fallbackText, defaultYear);
    }

    private String extractDateToken(String text) {
        Matcher matcher = DATE_TOKEN_PATTERN.matcher(text);
        return matcher.find() ? matcher.group() : null;
    }

    private LocalDate parseDateString(String value, int defaultYear) {
        if (!StringUtils.hasText(value)) {
            return null;
        }

        String normalized = value.trim().replaceAll("\\s+", " ");
        for (DateTimeFormatter formatter : DATE_FORMATTERS) {
            try {
                return LocalDate.parse(normalized, formatter);
            } catch (DateTimeParseException ignored) {
                // Try next formatter.
            }
        }

        List<DateTimeFormatter> yearLess = List.of(
            withDefaultYear("d/M", defaultYear),
            withDefaultYear("d-M", defaultYear),
            withDefaultYear("M/d", defaultYear),
            withDefaultYear("MMM d", defaultYear),
            withDefaultYear("MMMM d", defaultYear),
            withDefaultYear("d MMM", defaultYear),
            withDefaultYear("d MMMM", defaultYear)
        );
        for (DateTimeFormatter formatter : yearLess) {
            try {
                return LocalDate.parse(normalized, formatter);
            } catch (DateTimeParseException ignored) {
                // Try next formatter.
            }
        }

        return null;
    }

    private int inferYear(String text) {
        Matcher matcher = YEAR_PATTERN.matcher(String.valueOf(text == null ? "" : text));
        if (matcher.find()) {
            try {
                return Integer.parseInt(matcher.group(1));
            } catch (NumberFormatException ignored) {
                // Fall back below.
            }
        }
        return LocalDate.now().getYear();
    }

    private String normalizeTagsCsv(List<String> tags) {
        if (tags == null || tags.isEmpty()) {
            return "";
        }
        return tags.stream()
            .map(tag -> tag == null ? "" : tag.trim())
            .filter(StringUtils::hasText)
            .distinct()
            .collect(Collectors.joining(","));
    }

    private List<String> parseTags(String tagsCsv) {
        if (!StringUtils.hasText(tagsCsv)) {
            return Collections.emptyList();
        }
        return Arrays.stream(tagsCsv.split(","))
            .map(String::trim)
            .filter(StringUtils::hasText)
            .collect(Collectors.toList());
    }

    private HolidayResponse toResponse(Holiday holiday) {
        HolidayResponse response = new HolidayResponse();
        response.setId(holiday.getId());
        response.setName(holiday.getName());
        response.setDate(holiday.getDate());
        response.setTags(parseTags(holiday.getTagsCsv()));
        response.setTenantCode(holiday.getTenantCode());
        response.setCompanyId(holiday.getCompanyId());
        response.setUpdatedAt(holiday.getUpdatedAt());
        return response;
    }

    private HolidayUpdateFileResponse toFileResponse(HolidayUpdateFile entity) {
        HolidayUpdateFileResponse response = new HolidayUpdateFileResponse();
        response.setId(entity.getId());
        response.setFileName(entity.getFileName());
        response.setOriginalFileName(entity.getOriginalFileName());
        response.setFileType(entity.getFileType());
        response.setUploadedBy(entity.getUploadedBy());
        response.setUploadedAt(entity.getUploadedAt());
        response.setUploadDate(entity.getUploadedAt());
        response.setFilePath(entity.getFilePath());
        response.setFileUrl(entity.getFileUrl());
        return response;
    }

    private String getFileExtension(String filename) {
        int index = filename.lastIndexOf('.');
        return index >= 0 && index < filename.length() - 1 ? filename.substring(index + 1) : "";
    }

    private String resolveUploadedBy(User currentUser) {
        if (currentUser == null) {
            return "System";
        }
        if (StringUtils.hasText(currentUser.getFullName())) {
            return currentUser.getFullName();
        }
        if (StringUtils.hasText(currentUser.getEmail())) {
            return currentUser.getEmail();
        }
        return "System";
    }

    private File ensureHolidayUploadDirectory() {
        File uploadDir = new File(HOLIDAY_UPLOAD_DIR).getAbsoluteFile();
        if (uploadDir.exists() && !uploadDir.isDirectory()) {
            throw new RuntimeException("Upload path exists but is not a directory: " + uploadDir.getAbsolutePath());
        }
        if (!uploadDir.exists() && !uploadDir.mkdirs()) {
            throw new RuntimeException("Unable to create upload directory: " + uploadDir.getAbsolutePath());
        }
        return uploadDir;
    }

    private void notifySubscribers(String tenantCode, Long companyId) {
        try {
            holidayUpdatePublisher.publishChange(tenantCode, companyId);
        } catch (Exception ignored) {
            // Best effort only.
        }
    }

    private static DateTimeFormatter formatter(String pattern) {
        return new DateTimeFormatterBuilder()
            .parseCaseInsensitive()
            .appendPattern(pattern)
            .toFormatter(Locale.ENGLISH);
    }

    private static DateTimeFormatter withDefaultYear(String pattern, int year) {
        return new DateTimeFormatterBuilder()
            .parseCaseInsensitive()
            .appendPattern(pattern)
            .parseDefaulting(ChronoField.YEAR, year)
            .toFormatter(Locale.ENGLISH);
    }

    private record ParsedHoliday(String name, LocalDate date) { }
}
