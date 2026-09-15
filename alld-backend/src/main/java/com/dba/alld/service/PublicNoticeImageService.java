package com.dba.alld.service;

import com.dba.alld.dto.PublicNoticeImageResponse;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

public interface PublicNoticeImageService {
    PublicNoticeImageResponse upload(String name, MultipartFile imageFile, String uploadedBy) throws IOException;
    List<PublicNoticeImageResponse> listActive();
    void delete(Long id, String deletedBy);
}
