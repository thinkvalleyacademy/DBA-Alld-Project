package com.dba.alld.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StaffCollectionReportRequest {

    private String userId;
    private LocalDate startDate;
    private LocalDate endDate;

}
