package com.dba.alld.dto;

import org.springframework.web.multipart.MultipartFile;
import lombok.Data;

import java.time.LocalDate;

@Data
public class MemberRequest {
    private String memType;
    private Double amount;
    private String name;
    private String gender;
    private String guardianName;
    private LocalDate dob;
    private String bloodGroup;
    private String registrationType;
    private String registrationNo;
    private String enNo;
    private String address;
    private String city;
    private String zip;
    private String osAddress;
    private String mobile;
    private String email;
    private String nomineeName;
    private String nomineeMobile;
    private LocalDate dateOfMembership;
    private LocalDate lastSubscription;
    private String bcType;
    private MultipartFile bcFile;
    private String voter;
    private MultipartFile affidavitFile;
    private String photo;
    private String relation;
    
    // ✅ Skip checkbox flags for optional file uploads
    private Boolean skipDocUpload = false;      // Skip BC document upload
    private Boolean skipAffidavit = false;      // Skip affidavit upload
}


