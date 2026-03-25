package com.hireconnect.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import com.hireconnect.util.FileStorageUtil;

@Service
public class FileStorageService {

    @Value("${file.upload-dir:./uploads}")
    private String uploadDir;

    public String store(MultipartFile file, String subDir, String namePrefix) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("File is required");
        }

        String safeOriginal = FileStorageUtil.sanitizeFilename(file.getOriginalFilename(), "upload");
        String extension = FileStorageUtil.extensionOf(safeOriginal);
        String prefix = StringUtils.hasText(namePrefix) ? namePrefix : "file";
        String filename = prefix + "-" + UUID.randomUUID() + extension;

        Path baseDir = Paths.get(uploadDir).toAbsolutePath().normalize();
        Path targetDir = StringUtils.hasText(subDir)
                ? baseDir.resolve(subDir).normalize()
                : baseDir;

        if (!targetDir.startsWith(baseDir)) {
            throw new RuntimeException("Invalid upload path");
        }

        try {
            Files.createDirectories(targetDir);
            Path targetFile = targetDir.resolve(filename).normalize();
            if (!targetFile.startsWith(targetDir)) {
                throw new RuntimeException("Invalid upload path");
            }
            Files.copy(file.getInputStream(), targetFile, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file: " + e.getMessage(), e);
        }

        String normalizedSubDir = StringUtils.hasText(subDir) ? "/" + subDir.replace("\\", "/") : "";
        return ("/uploads" + normalizedSubDir + "/" + filename).replaceAll("/{2,}", "/");
    }
}
