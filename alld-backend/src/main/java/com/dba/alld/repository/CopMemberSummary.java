package com.dba.alld.repository;

import java.time.LocalDate;

public interface CopMemberSummary {

    String getMemberId();
    String getName();
    LocalDate getDob();
    String getGuardianName();
    String getRegistrationType();
    String getRegistrationNo();
    String getEnNo();
    String getMobile();
    String getAddress();
    String getPhoto();
}
