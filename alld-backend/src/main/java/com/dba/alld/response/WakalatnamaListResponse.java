package com.dba.alld.response;

import java.time.LocalDateTime;

public interface WakalatnamaListResponse {
    String getOrderId();
    String getMemberId();
    String getId();
    String getPaymentStatus();
    String getIsClient();
    LocalDateTime getCreatedDate();
    String getStatus();
}
