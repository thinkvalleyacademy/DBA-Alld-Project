package com.dba.alld.dto;

import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;

@Value
@Builder
public class PublicNoticeImageResponse {
    Long id;
    String name;
    String imagePath;
    String imageUrl;
    String cacheVersion;
    LocalDateTime createdDate;
}
