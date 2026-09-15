package com.dba.alld.response;

import java.time.LocalDateTime;

public interface AffidavitEntryListResponse {

    String getAffidavitNo();
    String getName();
    String getCouponNo();
    String getAdvocateName();
    String getAddress();
    String getAdvocateMobile();
    String getStatus();
    String getMemberId();
    String getMobile();
    LocalDateTime getCreatedDate();
}
