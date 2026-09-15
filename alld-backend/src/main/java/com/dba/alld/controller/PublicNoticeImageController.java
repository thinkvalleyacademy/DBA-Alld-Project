package com.dba.alld.controller;

import com.dba.alld.dto.GenericApiResponse;
import com.dba.alld.dto.PublicNoticeImageResponse;
import com.dba.alld.service.PublicNoticeImageService;
import com.dba.alld.utility.Utility;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/v1/public-notices")
public class PublicNoticeImageController {

    @Autowired
    private PublicNoticeImageService publicNoticeImageService;

    @Autowired
    private Utility utility;

    @GetMapping("/public")
    public ResponseEntity<GenericApiResponse<Object>> listPublicNoticeImages() {
        List<PublicNoticeImageResponse> notices = publicNoticeImageService.listActive();
        return ResponseEntity.ok(utility.buildResponse("Public notice images", HttpStatus.OK.value(), notices));
    }

    @PostMapping(value = "/upload", consumes = {"multipart/form-data"})
    public ResponseEntity<GenericApiResponse<Object>> uploadPublicNoticeImage(
            @RequestParam("name") String name,
            @RequestParam("image") MultipartFile image,
            Authentication authentication
    ) {
        try {
            String uploadedBy = extractUserId(authentication);
            PublicNoticeImageResponse response = publicNoticeImageService.upload(name, image, uploadedBy);
            return ResponseEntity.ok(utility.buildResponse("Public notice image uploaded", HttpStatus.OK.value(), response));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(utility.buildResponse(ex.getMessage(), HttpStatus.BAD_REQUEST.value(), null));
        } catch (IOException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(utility.buildResponse("Failed to upload image", HttpStatus.INTERNAL_SERVER_ERROR.value(), ex.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<GenericApiResponse<Object>> deletePublicNoticeImage(
            @PathVariable("id") Long id,
            Authentication authentication
    ) {
        try {
            String deletedBy = extractUserId(authentication);
            publicNoticeImageService.delete(id, deletedBy);
            return ResponseEntity.ok(utility.buildResponse("Public notice image deleted", HttpStatus.OK.value(), null));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(utility.buildResponse(ex.getMessage(), HttpStatus.BAD_REQUEST.value(), null));
        } catch (NoSuchElementException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(utility.buildResponse(ex.getMessage(), HttpStatus.NOT_FOUND.value(), null));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(utility.buildResponse("Failed to delete image", HttpStatus.INTERNAL_SERVER_ERROR.value(), ex.getMessage()));
        }
    }

    private String extractUserId(Authentication authentication) {
        if (authentication == null) {
            return "system";
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof UserDetails userDetails) {
            return userDetails.getUsername();
        }
        String name = authentication.getName();
        return name != null ? name : "system";
    }
}
