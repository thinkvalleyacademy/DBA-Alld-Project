package com.dba.alld.entities;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Table(name = "members")
@SuperBuilder
@Data
@Entity
@NoArgsConstructor
public class Members {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "member_id", nullable = false, length = 20)
    private String memberId;

    @Column(name = "member_type", nullable = false, length = 50)
    private String memberType;

    @Column(name = "name", nullable = false, length = 60)
    private String name;

    @Column(name = "gender", nullable = false, length = 20)
    private String gender;

    @Column(name = "relation", nullable = false, length = 20)
    private String relation;

    @Column(name = "guardian_name", nullable = false, length = 60)
    private String guardianName;

    @Column(name = "dob")
    private LocalDate dob;

    @Column(name = "blood_group", length = 20)
    private String bloodGroup;

    @Column(name = "registration_type", nullable = false, length = 100)
    private String registrationType;

    @Column(name = "registration_no", length = 64)
    private String registrationNo;

    @Column(name = "en_no", length = 64)
    private String enNo;

    @Column(name = "address", nullable = false, length = 200)
    private String address;

    @Column(name = "city", nullable = false, length = 60)
    private String city;

    @Column(name = "zip", nullable = false, length = 10)
    private String zip;

    @Column(name = "state", nullable = false, length = 60)
    private String state;

    @Column(name = "ks_address", nullable = false, length = 200)
    private String ksAddress;

    @Column(name = "mobile", nullable = false, length = 20)
    private String mobile;

    @Column(name = "email", length = 60)
    private String email;

    @Column(name = "nominee_name", nullable = false, length = 60)
    private String nomineeName;

    @Column(name = "nominee_mobile", nullable = false, length = 20)
    private String nomineeMobile;

    @Column(name = "membership_date")
    private LocalDate membershipDate;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(name = "bc_of_up_type", nullable = false, length = 20)
    private String bcOfUpType;

    @Column(name = "bc_of_up_photo", nullable = true, length = 200)
    private String bcOfUpPhoto;

    @Column(name = "voter", nullable = false, length = 20)
    private String voter;

    @Column(name = "affidavite", nullable = true, length = 200)
    private String affidavite;

    @Column(name = "photo", nullable = false, length = 200)
    private String photo;

    @Column(name = "qrcode", nullable = true, length = 200)
    private String qrcode;

    @Column(name = "qrcode_digit", nullable = false, length = 64)
    private String qrcodeDigit;

    @Column(name = "gm_lm_member_type", nullable = false)
    private Integer gmLmMemberType;

    @Column(name = "is_wm", nullable = false)
    @Builder.Default
    private Boolean isWm = false;

    @Column(name = "created_date", nullable = false)
    private LocalDateTime createdDate;

    @Column(name = "created_by", nullable = false, length = 20)
    private String createdBy;

    @Column(name = "updated_date")
    private LocalDateTime updatedDate;

    @Column(name = "updated_by", length = 20)
    private String updatedBy;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "ewallet_balance", nullable = false, precision = 10, scale = 2)
    private BigDecimal ewalletBalance;

    @Column(name = "designation", length = 45)
    private String designation;
}

