package com.dba.alld.controller;

import com.dba.alld.dto.GenericApiResponse;
import com.dba.alld.dto.MemberRequest;
import com.dba.alld.dto.ReCaptchaVerificationResult;
import com.dba.alld.entities.Members;
import com.dba.alld.request.RegistrationFeeRequest;
import com.dba.alld.request.UpdateMemberContactRequest;
import com.dba.alld.request.WelfareMemberRequest;
import com.dba.alld.service.MemberService;
import com.dba.alld.service.ReCaptchaService;
import com.dba.alld.utility.Utility;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartException;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/members")
public class MemberController {

    @Autowired
    MemberService membersService;

    @Autowired
    ReCaptchaService reCaptchaService;

    @Autowired
    Utility utility;

    @GetMapping("/search")
    public ResponseEntity<GenericApiResponse<Object>> searchMembers(
            @RequestParam String query,
            @RequestParam(required = false) Integer type

    ) {
        return ResponseEntity.ok(membersService.searchMembers(query, type));
    }

    @GetMapping("/generalsearch")
    public ResponseEntity<GenericApiResponse<Object>> searchMembers(
            @RequestParam String query,
            @RequestParam(required = false) Integer type,
            @RequestParam String captchaToken
    ) {
        ReCaptchaVerificationResult captchaResult = reCaptchaService.verify(captchaToken);
        
        if (!captchaResult.success()) {
            return ResponseEntity
                    .status(captchaResult.httpStatus())
                    .body(utility.buildResponse("ERROR",
                            captchaResult.httpStatus().value(),
                            captchaResult.message()));
        }
        
        return ResponseEntity.ok(membersService.searchMembers(query, type));
    }

    @GetMapping("/search-gm-lm")
    public ResponseEntity<GenericApiResponse<Object>> searchGeneralAndLifeMembers(
            @RequestParam String query
    ) {
        return ResponseEntity.ok(
                membersService.searchMembersByTypes(query, List.of(1, 2))
        );
    }


    @PostMapping(consumes = {"multipart/form-data", "application/json"})
    public ResponseEntity<GenericApiResponse<Object>> saveOrUpdateMember(
            @RequestPart("member") Members member,
            @RequestPart(value = "photo", required = false) MultipartFile photo,
            @RequestPart(value = "bcOfUpPhoto", required = false) MultipartFile bcOfUpPhoto,
            @RequestPart(value = "affidavite", required = false) MultipartFile affidavite,
            @RequestPart(value = "qrcode", required = false) MultipartFile qrcode,
            @RequestParam(value = "userId", required = true) String userId,
            // ✅ Skip checkbox flags for optional file uploads
            @RequestParam(value = "skipDocUpload", required = false, defaultValue = "false") Boolean skipDocUpload,
            @RequestParam(value = "skipAffidavit", required = false, defaultValue = "false") Boolean skipAffidavit
    ) throws IOException {
        return ResponseEntity.ok(membersService.saveOrUpdateMember(member, photo, bcOfUpPhoto, affidavite, qrcode, userId, skipDocUpload, skipAffidavit));
    }

    @PostMapping("/addWelfare")
    public ResponseEntity<GenericApiResponse<Object>> addWelfare(@RequestBody WelfareMemberRequest request)
    {
        return ResponseEntity.ok(membersService.addWelfareMember(request));
    }


    @GetMapping("/list")
    public ResponseEntity<GenericApiResponse<Object>> listUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Integer memberType,
            @RequestParam(required = false) String query
    ) {
        return ResponseEntity.ok(membersService.listMember(page, size, memberType, query));
    }

    @PostMapping("/member")
    public ResponseEntity<GenericApiResponse<Object>> memberDetails(
            @RequestParam String id
    ){
        return ResponseEntity.ok(membersService.memberDetails(id));
    }

    @PutMapping(value = "/updateContact", consumes = "application/json")
    public ResponseEntity<GenericApiResponse<Object>> updateContact(
            @RequestBody UpdateMemberContactRequest request
    ) {

        GenericApiResponse<Object> response = membersService.updateMemberContact(request);

        return ResponseEntity.status(response.getStatus()).body(response);
    }

    @PutMapping(value = "/updateContact", consumes = "multipart/form-data")
    public ResponseEntity<GenericApiResponse<Object>> updateContactWithFile(
            @RequestPart("member") UpdateMemberContactRequest request,
            @RequestPart(value = "bcOfUpPhoto", required = false) MultipartFile bcOfUpPhoto,
            @RequestPart(value = "affidavite", required = false) MultipartFile affidavite,
            @RequestPart(value = "photo", required = false) MultipartFile photo
    ) {
        GenericApiResponse<Object> response = membersService.updateMemberContact(request, bcOfUpPhoto, affidavite, photo);
        return ResponseEntity.status(response.getStatus()).body(response);
    }

    // ✅ Endpoint to fetch duplicate members (Admin only)
    @GetMapping("/duplicates")
    public ResponseEntity<GenericApiResponse<Object>> getDuplicateMembers(
            @RequestParam(required = false) String mobile
    ) {
        return ResponseEntity.ok(membersService.getDuplicateMembers(mobile));
    }

    // ✅ Endpoint to update member status (Admin only)
    @PutMapping("/{memberId}/status")
    public ResponseEntity<GenericApiResponse<Object>> updateMemberStatus(
            @PathVariable String memberId,
            @RequestBody Map<String, String> request
    ) {
        String newStatus = request.getOrDefault("newStatus", request.get("status"));
        return ResponseEntity.ok(membersService.updateMemberStatus(memberId, newStatus));
    }

    // ✅ Endpoint for bulk status update (Admin only)
    @PutMapping("/bulk-status")
    public ResponseEntity<GenericApiResponse<Object>> bulkUpdateMemberStatus(
            @RequestBody Map<String, Object> request
    ) {
        @SuppressWarnings("unchecked")
        List<String> memberIds = (List<String>) request.get("memberIds");
        String newStatus = (String) request.getOrDefault("newStatus", request.get("status"));
        return ResponseEntity.ok(membersService.bulkUpdateMemberStatus(memberIds, newStatus));
    }

    @PostMapping("/registration-fee")
    public ResponseEntity<GenericApiResponse<Object>> calculateRegistrationFee(
            @RequestBody RegistrationFeeRequest request
    ) {
        return ResponseEntity.ok(membersService.calculateRegistrationFee(request));
    }

    // Optimized endpoint for welfare member list download
    @GetMapping("/welfare-list")
    public ResponseEntity<GenericApiResponse<Object>> getWelfareMemberList(
            @RequestParam Integer memberType
    ) {
        return ResponseEntity.ok(membersService.getWelfareMemberListForDownload(memberType));
    }

    /**
     * Export member list to Excel file (server-side generation)
     * Returns binary Excel file for download
     */
    @GetMapping("/export-excel")
    public ResponseEntity<byte[]> exportMembersToExcel(
            @RequestParam(required = false) Integer memberType
    ) {
        return membersService.exportMembersToExcel(memberType);
    }

}
