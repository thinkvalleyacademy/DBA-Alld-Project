package com.dba.alld.request;

import lombok.*;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateMemberContactRequest {

    private String memberId;
    // Personal info
    private String name;
    private String fatherName;
    private String gender;
    private LocalDate dob;
    private String bloodGroup;

    // Contact & address
    private String address;
    private String city;
    private String state;
    private String zip;
    private String ksAddress;
    private String email;
    private String mobile;

    // Registration
    private String registrationType;  // C.O.P No., etc.
    private String copNumber;         // registrationNo
    private String enNo;
    private String bcOfUpType;
    private String voter;

    // Nominee
    private String nomineeName;
    private String nomineeMobile;

    // Meta
    private String updatedBy;

}
