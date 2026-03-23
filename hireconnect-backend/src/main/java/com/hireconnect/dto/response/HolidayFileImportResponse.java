package com.hireconnect.dto.response;

import java.util.ArrayList;
import java.util.List;

public class HolidayFileImportResponse {

    private HolidayUpdateFileResponse file;
    private List<HolidayResponse> importedHolidays = new ArrayList<>();
    private int importedCount;
    private int duplicateCount;
    private List<String> duplicateMessages = new ArrayList<>();

    public HolidayUpdateFileResponse getFile() {
        return file;
    }

    public void setFile(HolidayUpdateFileResponse file) {
        this.file = file;
    }

    public List<HolidayResponse> getImportedHolidays() {
        return importedHolidays;
    }

    public void setImportedHolidays(List<HolidayResponse> importedHolidays) {
        this.importedHolidays = importedHolidays;
    }

    public int getImportedCount() {
        return importedCount;
    }

    public void setImportedCount(int importedCount) {
        this.importedCount = importedCount;
    }

    public int getDuplicateCount() {
        return duplicateCount;
    }

    public void setDuplicateCount(int duplicateCount) {
        this.duplicateCount = duplicateCount;
    }

    public List<String> getDuplicateMessages() {
        return duplicateMessages;
    }

    public void setDuplicateMessages(List<String> duplicateMessages) {
        this.duplicateMessages = duplicateMessages;
    }
}
