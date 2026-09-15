package com.dba.alld.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegistrationFeeRequest {
    private String memberType;
    private Integer gmLmMemberType;
}
