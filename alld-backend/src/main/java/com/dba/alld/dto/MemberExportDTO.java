package com.dba.alld.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * DTO for Excel export - contains all fields needed for member list export
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MemberExportDTO {
    private Integer srNo;
    private String memberId;
    private String name;
    private String fatherName;
    private String copNo;
    private String enrollmentNo;
    private String regType;
    private String address;
    private String city;
    private String mobile;
    private LocalDate membershipDate;
    private LocalDate subscription;
    private String voter;
}
