/*
 * Copyright (c) 2025. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
 * Morbi non lorem porttitor neque feugiat blandit. Ut vitae ipsum eget quam lacinia accumsan.
 * Etiam sed turpis ac ipsum condimentum fringilla. Maecenas magna.
 * Proin dapibus sapien vel ante. Aliquam erat volutpat. Pellentesque sagittis ligula eget metus.
 * Vestibulum commodo. Ut rhoncus gravida arcu.
 */

package com.dba.alld.controller;

import com.dba.alld.service.S3Service;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.concurrent.TimeUnit;
import java.util.List;

@RestController
@RequestMapping("/files")
@Log4j2
public class FileController {

    @Value("${app.upload.base-path}")
    private String basePath;

    @Autowired
    S3Service s3Service;

    @GetMapping("/**")
    public ResponseEntity<InputStreamResource> serveFile(HttpServletRequest request) {

        try {
            String requestUri = request.getRequestURI();
            String contextPath = request.getContextPath();

            String prefix = contextPath + "/files/upload/";
            if (!requestUri.startsWith(prefix)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }

            String dynamicPath = requestUri.substring(prefix.length());
            Path relativePath = Paths.get(dynamicPath);

            String folderName = relativePath.getParent() != null ? relativePath.getParent().toString() : null;
            String fileName = relativePath.getFileName() != null ? relativePath.getFileName().toString() : null;

            log.info("Resolved folderName='{}', fileName='{}'", folderName, fileName);

            // 1. Try Local Storage first
            Path localPath = Paths.get(basePath)
                    .resolve("upload")
                    .resolve(dynamicPath)
                    .toAbsolutePath()
                    .normalize();

            if (Files.exists(localPath)) {
                log.info("Serving file from LOCAL path={}", localPath);
                InputStream inputStream = new FileInputStream(localPath.toFile());
                String contentType = Files.probeContentType(localPath);
                if (contentType == null) {
                    contentType = "application/octet-stream";
                }

                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .contentLength(Files.size(localPath))
                        .header("Content-Disposition", "inline; filename=\"" + fileName + "\"")
                        .header(HttpHeaders.CACHE_CONTROL, "public, max-age=" + TimeUnit.DAYS.toSeconds(30) + ", immutable")
                        .body(new InputStreamResource(inputStream));
            }

            // 2. Try S3 if Local fails
            log.info("Local file not found, trying S3 for key={}", dynamicPath);
            ResponseInputStream<GetObjectResponse> s3Object = s3Service.getImage(folderName, fileName);

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(s3Object.response().contentType()))
                    .contentLength(s3Object.response().contentLength())
                    .header("Content-Disposition", "inline; filename=\"" + fileName + "\"")
                    .header(HttpHeaders.CACHE_CONTROL, "public, max-age=" + TimeUnit.DAYS.toSeconds(30) + ", immutable")
                    .body(new InputStreamResource(s3Object));

        } catch (Exception e) {
            log.error("File fetch failed for URI={} | reason={}", request.getRequestURI(), e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }


    @PostMapping("/bulk-upload")
    public ResponseEntity<?> uploadBulk(
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam("folder") String folder
    ) throws IOException {

        List<String> uploadedKeys = s3Service.uploadBulkFiles(files, folder);

        return ResponseEntity.ok(uploadedKeys);
    }
}
