package com.dba.alld.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WakalatnamaGenerateRequest {

    private String orderId;
    private String memberId;
    private String name;
    private String mobile;
    private BigDecimal amount;
    private BigDecimal memberAmount;
    private String paymentStatus;
    private LocalDateTime paymentDate;
    private String status;
    private LocalDateTime createdDate;
    private String createdBy;
    private LocalDateTime updatedDate;
    private String updatedBy;
    private Boolean isClient;
}
