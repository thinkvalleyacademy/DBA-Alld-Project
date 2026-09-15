package com.dba.alld.repository;

import java.time.LocalDate;

public interface MemberSummary {

    String getName();
    String getMemberId();
    String getGuardianName();
    Integer getGmLmMemberType();
    String getRegistrationType();
    String getRegistrationNo();
    String getEnNo();
    String getKsAddress();
    String getAddress();
    String getCity();
    LocalDate getExpiryDate();
    String getStatus();
    String getMobile();
    String getPhoto();
    Boolean getIsWm();
    String getVoter();
    LocalDate getMembershipDate();
    String getUpdatedBy();
}
