package com.dba.alld.service.impl;

import com.dba.alld.dto.PublicNoticeImageResponse;
import com.dba.alld.entities.PublicNoticeImage;
import com.dba.alld.repository.PublicNoticeImageRepository;
import com.dba.alld.service.PublicNoticeImageService;
import com.dba.alld.service.S3Service;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.NoSuchElementException;

@Service
@Log4j2
public class PublicNoticeImageServiceImpl implements PublicNoticeImageService {

    private static final String NOTICE_FOLDER = "public-notices";

    @Autowired
    private PublicNoticeImageRepository publicNoticeImageRepository;

    @Autowired
    private S3Service s3Service;

    @Value("${server.servlet.context-path:}")
    private String contextPath;

    @Override
    @CacheEvict(value = "publicNoticeImages", allEntries = true)
    public PublicNoticeImageResponse upload(String name, MultipartFile imageFile, String uploadedBy) throws IOException {
        if (!StringUtils.hasText(name)) {
            throw new IllegalArgumentException("Image name is required");
        }
        if (imageFile == null || imageFile.isEmpty()) {
            throw new IllegalArgumentException("Image file is required");
        }

        String imagePath = s3Service.uploadImage(imageFile, NOTICE_FOLDER);

        PublicNoticeImage entity = new PublicNoticeImage();
        entity.setName(name.trim());
        entity.setImagePath(imagePath);
        entity.setActive(true);
        entity.setCreatedBy(uploadedBy);
        entity.setUpdatedBy(uploadedBy);
        entity.setCreatedDate(LocalDateTime.now());
        entity.setUpdatedDate(LocalDateTime.now());

        PublicNoticeImage saved = publicNoticeImageRepository.save(entity);
        log.info("Public notice image uploaded | id={} | createdBy={} | path={}",
                saved.getId(), uploadedBy, saved.getImagePath());

        return toResponse(saved);
    }

    @Override
    @Cacheable("publicNoticeImages")
    public List<PublicNoticeImageResponse> listActive() {
        return publicNoticeImageRepository.findByActiveTrueOrderByCreatedDateDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @CacheEvict(value = "publicNoticeImages", allEntries = true)
    public void delete(Long id, String deletedBy) {
        if (id == null) {
            throw new IllegalArgumentException("Notice id is required");
        }

        PublicNoticeImage entity = publicNoticeImageRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Notice image not found"));

        if (Boolean.FALSE.equals(entity.getActive())) {
            return;
        }

        entity.setActive(false);
        entity.setUpdatedBy(deletedBy);
        entity.setUpdatedDate(LocalDateTime.now());
        publicNoticeImageRepository.save(entity);

        s3Service.deleteByDbPath(entity.getImagePath());

        log.info("Public notice image deleted | id={} | deletedBy={}", id, deletedBy);
    }

    private PublicNoticeImageResponse toResponse(PublicNoticeImage image) {
        String version = String.valueOf(image.getUpdatedDate() != null
                ? image.getUpdatedDate().toInstant(ZoneOffset.UTC).toEpochMilli()
                : image.getCreatedDate().toInstant(ZoneOffset.UTC).toEpochMilli());

        String normalizedContextPath = normalizeContextPath(contextPath);

        return PublicNoticeImageResponse.builder()
                .id(image.getId())
                .name(image.getName())
                .imagePath(image.getImagePath())
                .imageUrl(normalizedContextPath + "/files/" + image.getImagePath())
                .cacheVersion(version)
                .createdDate(image.getCreatedDate())
                .build();
    }

    private String normalizeContextPath(String raw) {
        if (raw == null || raw.isBlank() || "/".equals(raw.trim())) {
            return "";
        }
        String value = raw.trim();
        if (!value.startsWith("/")) {
            value = "/" + value;
        }
        if (value.endsWith("/")) {
            value = value.substring(0, value.length() - 1);
        }
        return value;
    }
}
