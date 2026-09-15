package com.dba.alld.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserListResponse {

    private String userId;
    private String name;
    private String mobile;
    private String email;
    private Integer roleId;
    private String status;

}
