package com.hireconnect.service;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.hssf.usermodel.HSSFWorkbook;
import org.apache.poi.hwpf.HWPFDocument;
import org.apache.poi.hwpf.usermodel.Range;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.DateUtil;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFTable;
import org.apache.poi.xwpf.usermodel.XWPFTableRow;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import com.hireconnect.dto.request.HolidayRequest;
import com.hireconnect.entity.Holiday;
import com.hireconnect.entity.HolidayAttachment;
import com.hireconnect.util.FileStorageUtil;

@Service
public class HolidayImportService {

    private static final List<DateTimeFormatter> DATE_FORMATS = Arrays.asList(
            DateTimeFormatter.ofPattern("yyyy-MM-dd"),
            DateTimeFormatter.ofPattern("dd-MM-yyyy"),
            DateTimeFormatter.ofPattern("dd/MM/yyyy"),
            DateTimeFormatter.ofPattern("MM/dd/yyyy"),
            DateTimeFormatter.ofPattern("dd MMM yyyy", Locale.ENGLISH),
            DateTimeFormatter.ofPattern("d MMM yyyy", Locale.ENGLISH),
            DateTimeFormatter.ofPattern("d-MMM-yyyy", Locale.ENGLISH),
            DateTimeFormatter.ofPattern("MMM d, yyyy", Locale.ENGLISH)
    );

    private static final Pattern DATE_REGEX = Pattern.compile(
            "(\\d{4}-\\d{2}-\\d{2}|\\d{2}[/-]\\d{2}[/-]\\d{4}|\\d{1,2}\\s+[A-Za-z]{3,9}\\s+\\d{4}|[A-Za-z]{3,9}\\s+\\d{1,2},?\\s+\\d{4})"
    );

    private final HolidayService holidayService;

    public HolidayImportService(HolidayService holidayService) {
        this.holidayService = holidayService;
    }

    public ImportResult importFromAttachment(HolidayAttachment attachment) throws IOException {
        String ext = getExtension(attachment.getFileName());
        List<ParsedHoliday> parsed;
        if (FileStorageUtil.hasData(attachment.getFileData())) {
            parsed = parseFile(ext, attachment.getFileData());
        } else {
            Path path = Paths.get(".").resolve(attachment.getFilePath().replaceFirst("^/+", "")).normalize();
            if (!Files.exists(path)) {
                throw new RuntimeException("Uploaded file not found on server");
            }
            parsed = parseFile(ext, path);
        }

        if (parsed.isEmpty()) {
            throw new RuntimeException("Could not parse any holidays from the uploaded file");
        }

        List<Holiday> created = new ArrayList<>();
        List<ParsedHoliday> duplicates = new ArrayList<>();
        Set<String> existingKeys = new HashSet<>();
        holidayService.getHolidays(attachment.getTenantCode(), attachment.getCompanyId())
                .forEach(h -> existingKeys.add(key(h.getName(), h.getDate())));

        for (ParsedHoliday row : parsed) {
            String k = key(row.name(), row.date());
            if (existingKeys.contains(k) || holidayService.exists(attachment.getTenantCode(), attachment.getCompanyId(), row.name(), row.date())) {
                duplicates.add(row);
                continue;
            }
            HolidayRequest req = new HolidayRequest();
            req.setName(row.name());
            req.setDate(row.date());
            Holiday saved = holidayService.createHoliday(attachment.getTenantCode(), attachment.getCompanyId(), req);
            created.add(saved);
            existingKeys.add(k);
        }

        return new ImportResult(created, duplicates);
    }

    private List<ParsedHoliday> parseFile(String ext, Path path) throws IOException {
        String lower = ext.toLowerCase();
        if (lower.equals("pdf")) {
            return parsePdf(path);
        } else if (lower.equals("docx")) {
            return parseDocx(path);
        } else if (lower.equals("doc")) {
            return parseDoc(path);
        } else if (lower.equals("xls") || lower.equals("xlsx")) {
            return parseExcel(path);
        }
        throw new RuntimeException("Unsupported file type: " + ext);
    }

    private List<ParsedHoliday> parseFile(String ext, byte[] fileData) throws IOException {
        String lower = ext.toLowerCase();
        if (lower.equals("pdf")) {
            return parsePdf(fileData);
        } else if (lower.equals("docx")) {
            return parseDocx(fileData);
        } else if (lower.equals("doc")) {
            return parseDoc(fileData);
        } else if (lower.equals("xls") || lower.equals("xlsx")) {
            return parseExcel(fileData, lower);
        }
        throw new RuntimeException("Unsupported file type: " + ext);
    }

    private List<ParsedHoliday> parsePdf(Path path) throws IOException {
        try (PDDocument doc = Loader.loadPDF(path.toFile())) {
            PDFTextStripper stripper = new PDFTextStripper();
            String text = stripper.getText(doc);
            return parseLines(text.split("\\r?\\n"));
        }
    }

    private List<ParsedHoliday> parsePdf(byte[] fileData) throws IOException {
        try (PDDocument doc = Loader.loadPDF(fileData)) {
            PDFTextStripper stripper = new PDFTextStripper();
            String text = stripper.getText(doc);
            return parseLines(text.split("\\r?\\n"));
        }
    }

    private List<ParsedHoliday> parseDocx(Path path) throws IOException {
        try (InputStream is = Files.newInputStream(path); XWPFDocument document = new XWPFDocument(is)) {
            List<String> lines = new ArrayList<>();
            for (XWPFParagraph p : document.getParagraphs()) {
                lines.add(p.getText());
            }
            for (XWPFTable table : document.getTables()) {
                for (XWPFTableRow row : table.getRows()) {
                    StringBuilder sb = new StringBuilder();
                    row.getTableCells().forEach(c -> sb.append(c.getText()).append(" "));
                    lines.add(sb.toString().trim());
                }
            }
            return parseLines(lines.toArray(String[]::new));
        }
    }

    private List<ParsedHoliday> parseDocx(byte[] fileData) throws IOException {
        try (InputStream is = new ByteArrayInputStream(fileData); XWPFDocument document = new XWPFDocument(is)) {
            List<String> lines = new ArrayList<>();
            for (XWPFParagraph p : document.getParagraphs()) {
                lines.add(p.getText());
            }
            for (XWPFTable table : document.getTables()) {
                for (XWPFTableRow row : table.getRows()) {
                    StringBuilder sb = new StringBuilder();
                    row.getTableCells().forEach(c -> sb.append(c.getText()).append(" "));
                    lines.add(sb.toString().trim());
                }
            }
            return parseLines(lines.toArray(String[]::new));
        }
    }

    private List<ParsedHoliday> parseDoc(Path path) throws IOException {
        try (InputStream is = Files.newInputStream(path); HWPFDocument document = new HWPFDocument(is)) {
            Range range = document.getRange();
            String text = range.text();
            return parseLines(text.split("\\r?\\n"));
        }
    }

    private List<ParsedHoliday> parseDoc(byte[] fileData) throws IOException {
        try (InputStream is = new ByteArrayInputStream(fileData); HWPFDocument document = new HWPFDocument(is)) {
            Range range = document.getRange();
            String text = range.text();
            return parseLines(text.split("\\r?\\n"));
        }
    }

    private List<ParsedHoliday> parseExcel(Path path) throws IOException {
        try (InputStream is = Files.newInputStream(path)) {
            Workbook workbook = path.toString().toLowerCase().endsWith("xlsx") ? new XSSFWorkbook(is) : new HSSFWorkbook(is);
            List<ParsedHoliday> rows = new ArrayList<>();
            Sheet sheet = workbook.getNumberOfSheets() > 0 ? workbook.getSheetAt(0) : null;
            if (sheet == null) return rows;
            for (Row row : sheet) {
                if (row == null) continue;
                String name = getCellString(row.getCell(0));
                String dateString = getCellString(row.getCell(1));
                if (name.isBlank() && dateString.isBlank()) continue;
                LocalDate date = parseDateFlexible(dateString, row.getCell(1));
                if (date != null && !name.isBlank()) {
                    rows.add(new ParsedHoliday(name.trim(), date));
                }
            }
            workbook.close();
            return rows;
        }
    }

    private List<ParsedHoliday> parseExcel(byte[] fileData, String extension) throws IOException {
        try (InputStream is = new ByteArrayInputStream(fileData)) {
            Workbook workbook = extension.endsWith("xlsx") ? new XSSFWorkbook(is) : new HSSFWorkbook(is);
            List<ParsedHoliday> rows = new ArrayList<>();
            Sheet sheet = workbook.getNumberOfSheets() > 0 ? workbook.getSheetAt(0) : null;
            if (sheet == null) return rows;
            for (Row row : sheet) {
                if (row == null) continue;
                String name = getCellString(row.getCell(0));
                String dateString = getCellString(row.getCell(1));
                if (name.isBlank() && dateString.isBlank()) continue;
                LocalDate date = parseDateFlexible(dateString, row.getCell(1));
                if (date != null && !name.isBlank()) {
                    rows.add(new ParsedHoliday(name.trim(), date));
                }
            }
            workbook.close();
            return rows;
        }
    }

    private List<ParsedHoliday> parseLines(String[] lines) {
        List<ParsedHoliday> list = new ArrayList<>();
        for (String line : lines) {
            if (line == null) continue;
            String trimmed = line.trim();
            if (trimmed.isEmpty()) continue;
            Matcher m = DATE_REGEX.matcher(trimmed);
            if (m.find()) {
                String datePart = m.group(1);
                LocalDate date = parseDateFlexible(datePart, null);
                String name = trimmed.replace(datePart, "").replaceAll("[\\-,:]+", " ").trim();
                if (date != null && !name.isBlank()) {
                    list.add(new ParsedHoliday(name, date));
                }
            } else {
                // lines without regex match might be "Name - dd MMM yyyy" with dash separation
                String[] parts = trimmed.split("\\s{2,}");
                if (parts.length >= 2) {
                    LocalDate date = parseDateFlexible(parts[1], null);
                    if (date != null) {
                        list.add(new ParsedHoliday(parts[0].trim(), date));
                    }
                }
            }
        }
        return list;
    }

    private LocalDate parseDateFlexible(String text, Cell dateCell) {
        if (dateCell != null && dateCell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(dateCell)) {
            return dateCell.getDateCellValue().toInstant().atZone(java.time.ZoneId.systemDefault()).toLocalDate();
        }
        if (text == null) return null;
        String value = text.trim().replaceAll("\\s+", " ");
        for (DateTimeFormatter fmt : DATE_FORMATS) {
            try {
                return LocalDate.parse(value, fmt);
            } catch (DateTimeParseException ignored) {
            }
        }
        return null;
    }

    private String getCellString(Cell cell) {
        if (cell == null) return "";
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getLocalDateTimeCellValue().toLocalDate().toString();
                }
                return String.valueOf((long) cell.getNumericCellValue());
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            default:
                return "";
        }
    }

    private String getExtension(String filename) {
        if (filename == null) return "";
        int idx = filename.lastIndexOf('.');
        return idx == -1 ? "" : filename.substring(idx + 1);
    }

    private String key(String name, LocalDate date) {
        return name.toLowerCase().trim() + "::" + date.toString();
    }

    public record ImportResult(List<Holiday> created, List<ParsedHoliday> duplicates) { }

    public record ParsedHoliday(String name, LocalDate date) { }
}
