package com.dba.alld.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class WelfareCompensationDTO {

    private String compensationId;
    private String memberId;
    private String memberName;
    private BigDecimal amount;
    private LocalDate compensationDate;
    private String description;
    private LocalDateTime createdDate;
    private String userPhone;
}
