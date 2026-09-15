package com.dba.alld.repository;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;

/**
 * Lightweight DTO for welfare member list download
 * Contains only the fields needed for the print view
 */
public interface WelfareMemberSummary {
    @NotBlank(message = "Member ID is required")
    String getMemberId();
    
    @NotBlank(message = "Name is required")
    String getName();
    
    String getGuardianName();
    
    @NotBlank(message = "Registration number is required")
    String getRegistrationNo();
    
    String getEnNo();
    String getAddress();
    LocalDate getExpiryDate();
    
    @NotBlank(message = "Mobile number is required")
    String getMobile();

    String getPhoto();
    Boolean getIsWm();
}
