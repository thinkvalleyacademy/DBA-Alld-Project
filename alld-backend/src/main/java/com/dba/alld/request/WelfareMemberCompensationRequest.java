package com.dba.alld.request;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class WelfareMemberCompensationRequest {

    private String memberId;
    private BigDecimal amount;
    private LocalDate compensationDate;
    private String description;
}