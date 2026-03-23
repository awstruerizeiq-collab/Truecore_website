package com.hireconnect.util;

import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;

public final class FileStorageUtil {

    private FileStorageUtil() {
    }

    public static String sanitizeFilename(String originalFilename, String fallback) {
        String candidate = StringUtils.hasText(originalFilename)
                ? StringUtils.cleanPath(originalFilename)
                : fallback;
        String safeName = Paths.get(candidate).getFileName().toString();
        return safeName.isBlank() ? fallback : safeName;
    }

    public static String extensionOf(String filename) {
        if (!StringUtils.hasText(filename)) {
            return "";
        }
        int dotIndex = filename.lastIndexOf('.');
        return dotIndex >= 0 ? filename.substring(dotIndex) : "";
    }

    public static String contentTypeOrDefault(String contentType) {
        return StringUtils.hasText(contentType)
                ? contentType
                : MediaType.APPLICATION_OCTET_STREAM_VALUE;
    }

    public static boolean hasData(byte[] data) {
        return data != null && data.length > 0;
    }

    public static String absoluteUrl(String baseUrl, String path) {
        if (!StringUtils.hasText(path)) {
            return null;
        }
        if (path.startsWith("http://") || path.startsWith("https://")) {
            return path;
        }
        String base = StringUtils.hasText(baseUrl) ? baseUrl.replaceAll("/+$", "") : "";
        if (!path.startsWith("/")) {
            return base + "/" + path;
        }
        return base + path;
    }

    public static ResponseEntity<Resource> buildResponse(
            byte[] data,
            String legacyPath,
            String contentType,
            String fileName,
            boolean attachment
    ) {
        if (hasData(data)) {
            return buildByteArrayResponse(data, contentType, fileName, attachment);
        }
        return buildLegacyFileResponse(legacyPath, contentType, fileName, attachment);
    }

    public static ResponseEntity<Resource> buildByteArrayResponse(
            byte[] data,
            String contentType,
            String fileName,
            boolean attachment
    ) {
        if (!hasData(data)) {
            throw new RuntimeException("File content not found");
        }
        Resource resource = new ByteArrayResource(data) {
            @Override
            public String getFilename() {
                return fileName;
            }
        };
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentTypeOrDefault(contentType)))
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition(attachment, fileName))
                .body(resource);
    }

    public static ResponseEntity<Resource> buildLegacyFileResponse(
            String legacyPath,
            String contentType,
            String fileName,
            boolean attachment
    ) {
        Resource resource = legacyResource(legacyPath);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentTypeOrDefault(contentType)))
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition(attachment, fileName))
                .body(resource);
    }

    public static Resource legacyResource(String legacyPath) {
        if (!StringUtils.hasText(legacyPath) || legacyPath.startsWith("/api/")) {
            throw new RuntimeException("File content not found");
        }
        Path path = Paths.get(".").resolve(legacyPath.replaceFirst("^/+", "")).normalize();
        Resource resource = new FileSystemResource(path);
        if (!resource.exists() || !resource.isReadable()) {
            throw new RuntimeException("File content not found");
        }
        return resource;
    }

    private static String disposition(boolean attachment, String fileName) {
        String safeName = StringUtils.hasText(fileName) ? fileName.replace("\"", "") : "file";
        return (attachment ? "attachment" : "inline") + "; filename=\"" + safeName + "\"";
    }
}
