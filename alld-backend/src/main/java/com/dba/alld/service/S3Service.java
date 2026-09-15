package com.dba.alld.service;

import lombok.Getter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.core.exception.SdkClientException;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.*;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.function.Supplier;

@Service
public class S3Service {
    private static final int APP_S3_MAX_ATTEMPTS = 4;
    private static final long APP_S3_INITIAL_BACKOFF_MS = 300L;

    @Autowired
    S3Client s3Client;

    @Getter
    @Value("${aws.s3.bucket.name}")
    private String bucketName;

    @Value("${app.upload.base-path}")
    private String uploadDir;

    @Value("${s3.enabled:true}")
    private boolean s3Enabled;

    Logger log = LoggerFactory.getLogger(S3Service.class);

    public String uploadImage(MultipartFile file, String folder) throws IOException {

        log.info("Image upload request received | folder={} | s3Enabled={}", folder, s3Enabled);

        if (file == null || file.isEmpty()) {
            log.warn("Empty file upload attempted | folder={}", folder);
            return null;
        }

        // Epoch based filename
        long epoch = System.currentTimeMillis();
        String suffix = getSuffixByType(folder);
        String originalName = Objects.requireNonNull(file.getOriginalFilename());
        String extension = "";

        int dotIndex = originalName.lastIndexOf('.');
        if (dotIndex > 0) {
            extension = originalName.substring(dotIndex);
        }

        String fileName = epoch + suffix + extension;
        String key = folder + "/" + fileName;
        String dbPath = "upload/" + key;

        log.info("Is s3Enabled ={}", s3Enabled);
        // 1. S3 Upload (Conditional)
        if (s3Enabled) {
            try {
                log.info("Uploading to S3 | key={}", key);
                PutObjectRequest request = PutObjectRequest.builder()
                        .bucket(bucketName)
                        .key(key)
                        .contentType(file.getContentType())
                        .build();

                executeWithRetry(
                        () -> {
                            try {
                                s3Client.putObject(
                                        request,
                                        RequestBody.fromInputStream(file.getInputStream(), file.getSize())
                                );
                            } catch (IOException ioe) {
                                throw new UncheckedIOException(ioe);
                            }
                            return null;
                        },
                        "putObject",
                        key
                );
            } catch (Exception e) {
                log.error("S3 upload failed | key={} | reason={}", key, e.getMessage());
                // If S3 is enabled but fails, we still try local backup if possible, 
                // but usually S3 is primary. If S3 fails and is primary, we might want to throw.
                // However, user said "When enabled use both", implying local is always there.
            }
        }

        // 2. Local Storage (Always)
        try {
            Path targetDir = Paths.get(uploadDir)
                    .resolve("upload")
                    .resolve(folder)
                    .toAbsolutePath()
                    .normalize();

            Files.createDirectories(targetDir);
            Path targetFile = targetDir.resolve(fileName);

            log.info("Saving file locally | path={}", targetFile);

            Files.copy(
                    file.getInputStream(),
                    targetFile,
                    StandardCopyOption.REPLACE_EXISTING
            );
        } catch (Exception e) {
            log.error("Local storage failed | folder={} | fileName={} | reason={}",
                    folder, fileName, e.getMessage());
            if (!s3Enabled) {
                throw new IOException("Local storage failed and S3 is disabled", e);
            }
        }

        return dbPath;
    }

    public String uploadMemberImage(MultipartFile file, String folder, String memberId, String existingDbPath) throws IOException {
        log.info("S3 uploadMemberImage | folder={} | memberId={} | s3Enabled={}", folder, memberId, s3Enabled);

        if (file == null || file.isEmpty()) {
            return existingDbPath;
        }

        String extension = extractExtension(file.getOriginalFilename());
        String safeMemberId = sanitizeMemberId(memberId);
        String fileName = safeMemberId + getSuffixByType(folder) + extension;
        String key = folder + "/" + fileName;
        String dbPath = "upload/" + key;

        // 1. S3 Upload
        if (s3Enabled) {
            try {
                PutObjectRequest request = PutObjectRequest.builder()
                        .bucket(bucketName)
                        .key(key)
                        .contentType(file.getContentType())
                        .build();

                executeWithRetry(
                        () -> {
                            try {
                                s3Client.putObject(request, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
                            } catch (IOException ioe) {
                                throw new UncheckedIOException(ioe);
                            }
                            return null;
                        },
                        "putObject",
                        key
                );
            } catch (Exception e) {
                log.error("S3 uploadMemberImage failed | key={} | reason={}", key, e.getMessage());
            }
        }

        // 2. Local Storage
        try {
            Path targetDir = Paths.get(uploadDir)
                    .resolve("upload")
                    .resolve(folder)
                    .toAbsolutePath()
                    .normalize();
            
            Files.createDirectories(targetDir);
            Files.copy(
                    file.getInputStream(),
                    targetDir.resolve(fileName),
                    StandardCopyOption.REPLACE_EXISTING
            );
        } catch (Exception e) {
            log.error("Local storage failed in uploadMemberImage | reason={}", e.getMessage());
            if (!s3Enabled) {
                throw new IOException("Local storage failed and S3 is disabled", e);
            }
        }

        deletePreviousIfDifferent(existingDbPath, key);

        return dbPath;
    }

    public ResponseInputStream<GetObjectResponse> getImage(String folder, String fileName) {

        String key = folder + "/" + fileName;

        log.info("Preparing S3 GetObject request. Bucket={}, Key={}",
                bucketName,
                key);

        GetObjectRequest request = GetObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .build();

        ResponseInputStream<GetObjectResponse> response = executeWithRetry(
                () -> s3Client.getObject(request),
                "getObject",
                key
        );

        log.info("S3 GetObject successful. Bucket={}, Key={}, ContentType={}, Size={}",
                bucketName,
                key,
                response.response().contentType(),
                response.response().contentLength());

        return response;
    }

    public void deleteByDbPath(String dbPath) {
        if (dbPath == null || dbPath.isBlank()) {
            return;
        }

        String key = dbPath.startsWith("upload/")
                ? dbPath.substring("upload/".length())
                : dbPath;

        try {
            executeWithRetry(
                    () -> {
                        s3Client.deleteObject(DeleteObjectRequest.builder()
                                .bucket(bucketName)
                                .key(key)
                                .build());
                        return null;
                    },
                    "deleteObject",
                    key
            );

            Path localFile = Paths.get(uploadDir)
                    .toAbsolutePath()
                    .normalize()
                    .resolve("upload")
                    .resolve(key)
                    .normalize();

            try {
                Files.deleteIfExists(localFile);
            } catch (Exception localDeleteError) {
                log.warn("Failed deleting local backup | path={} | reason={}",
                        localFile, localDeleteError.getMessage());
            }

            log.info("Deleted object for dbPath={} | key={}", dbPath, key);
        } catch (Exception e) {
            log.warn("Failed deleting S3 object for dbPath={} | key={} | reason={}",
                    dbPath, key, e.getMessage());
        }
    }


    private String getSuffixByType(String type) {
        return switch (type) {
            case "photos" -> "-photo";
            case "bc_of_up_photo" -> "-bc";
            case "affidavit" -> "-affidavit";
            case "qrcode" -> "-qrcode";
            default -> "";
        };
    }

    private String extractExtension(String originalName) {
        if (originalName == null) {
            return "";
        }
        int dotIndex = originalName.lastIndexOf('.');
        return dotIndex > 0 ? originalName.substring(dotIndex) : "";
    }

    private String sanitizeMemberId(String memberId) {
        if (memberId == null || memberId.isBlank()) {
            return "member";
        }
        return memberId.replaceAll("[^A-Za-z0-9_-]", "_");
    }

    private void deletePreviousIfDifferent(String existingDbPath, String newKey) {
        if (existingDbPath == null || existingDbPath.isBlank()) {
            return;
        }

        String oldKey = existingDbPath.startsWith("upload/")
                ? existingDbPath.substring("upload/".length())
                : existingDbPath;

        if (oldKey.equals(newKey)) {
            return;
        }

        try {
            executeWithRetry(
                    () -> {
                        s3Client.deleteObject(DeleteObjectRequest.builder()
                                .bucket(bucketName)
                                .key(oldKey)
                                .build());
                        return null;
                    },
                    "deleteObject",
                    oldKey
            );
            log.info("Deleted file: {}", fileNameFromKey(oldKey));
        } catch (Exception e) {
            log.warn("Failed deleting old S3 object | bucket={} | key={} | reason={}",
                    bucketName, oldKey, e.getMessage());
        }
    }

    private String fileNameFromKey(String key) {
        if (key == null || key.isBlank()) {
            return "";
        }
        int slash = key.lastIndexOf('/');
        return slash >= 0 ? key.substring(slash + 1) : key;
    }

    public List<String> uploadBulkFiles(List<MultipartFile> files, String folder) {

        long bulkStartTime = System.currentTimeMillis();
        log.info("Bulk upload started | folder={} | totalFiles={}",
                folder, files != null ? files.size() : 0);

        if (files == null || files.isEmpty()) {
            return Collections.emptyList();
        }

        List<String> uploadedKeys = Collections.synchronizedList(new ArrayList<>());

        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {

            List<Future<?>> futures = new ArrayList<>();

            for (MultipartFile file : files) {

                futures.add(executor.submit(() -> {
                    processSingleFile(file, folder, uploadedKeys);
                }));
            }

            // Wait for all uploads to finish
            for (Future<?> future : futures) {
                future.get();
            }

        } catch (Exception e) {
            log.error("Bulk upload failed", e);
        }

        long bulkEndTime = System.currentTimeMillis();
        log.info("Bulk upload completed | folder={} | successCount={} | duration={} ms",
                folder, uploadedKeys.size(), (bulkEndTime - bulkStartTime));

        return uploadedKeys;
    }

    private void processSingleFile(MultipartFile file,
                                   String folder,
                                   List<String> uploadedKeys) {

        if (file.isEmpty()) {
            return;
        }

        try {
            String originalName = file.getOriginalFilename();
            String extension = "";

            int dotIndex = originalName.lastIndexOf('.');
            if (dotIndex > 0) {
                
                extension = originalName.substring(dotIndex);
            }

            String fileName = System.currentTimeMillis() +
                    "-" + UUID.randomUUID() + extension;

            String key = folder + "/" + fileName;

            Path tempFile = Files.createTempFile("upload-", extension);
            Files.copy(file.getInputStream(), tempFile,
                    StandardCopyOption.REPLACE_EXISTING);

            PutObjectRequest request = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .contentType(file.getContentType())
                    .build();

            executeWithRetry(
                    () -> {
                        s3Client.putObject(request, RequestBody.fromFile(tempFile));
                        return null;
                    },
                    "putObject",
                    key
            );

            Files.deleteIfExists(tempFile);

            uploadedKeys.add(key);

            log.info("Upload successful | key={}", key);

        } catch (Exception e) {
            log.error("Upload failed | file={}", file.getOriginalFilename(), e);
        }
    }

    private <T> T executeWithRetry(Supplier<T> action, String operation, String key) {
        long backoffMs = APP_S3_INITIAL_BACKOFF_MS;
        RuntimeException last = null;

        for (int attempt = 1; attempt <= APP_S3_MAX_ATTEMPTS; attempt++) {
            try {
                return action.get();
            } catch (UncheckedIOException e) {
                throw new RuntimeException(e.getCause());
            } catch (S3Exception | SdkClientException e) {
                last = e;
                boolean retryable = isRetryable(e);
                if (!retryable || attempt == APP_S3_MAX_ATTEMPTS) {
                    log.error("S3 {} failed for key={} after {} attempts | reason={}",
                            operation, key, attempt, e.getMessage());
                    throw e;
                }
                log.warn("S3 {} transient failure for key={} attempt {}/{} | retrying in {} ms | reason={}",
                        operation, key, attempt, APP_S3_MAX_ATTEMPTS, backoffMs, e.getMessage());
                sleepQuietly(backoffMs);
                backoffMs *= 2;
            }
        }

        throw last != null ? last : new RuntimeException("S3 operation failed");
    }

    private boolean isRetryable(RuntimeException e) {
        if (e instanceof S3Exception s3e) {
            int status = s3e.statusCode();
            return status == 429 || status == 500 || status == 503 || status == 400;
        }
        return true;
    }

    private void sleepQuietly(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
        }
    }


}
