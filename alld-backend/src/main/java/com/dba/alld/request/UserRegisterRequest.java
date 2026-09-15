package com.dba.alld.request;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserRegisterRequest {

    private Integer id;
    private String userId;
    private String sessionId;
    private String name;
    private String mobile;
    private String password;
    private String email;
    private String status;
    private Integer roleId;
    private String rememberMeToken;
    private String branchCode;
    private LocalDateTime regDate;
    private LocalDateTime createdDate;
    private String createdBy;
    private LocalDateTime lastLoginAttempt;
    private Integer wrongAttempts;
    private LocalDateTime lastWrongAttempt;
    private String activationHash;
    private String passwordResetHash;
    private LocalDateTime lastPasswordResetDate;
    private LocalDateTime updatedDate;
    private String updatedBy;
    private String domain;
    private String providerType;
    private String userPasswordResetTimestamp;

}





