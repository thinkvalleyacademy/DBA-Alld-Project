package com.dba.alld.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionRequest {

    private String memberID;
    private Integer amount;
    private Integer monthsNo;
    private String userPhone;

}
