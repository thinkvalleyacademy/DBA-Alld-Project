package com.dba.alld.entities;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;


@Table(name = "users")
@SuperBuilder
@Data
@Entity
@NoArgsConstructor
public class Users {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "user_id", nullable = false, unique = true, length = 20)
    private String userId;

    @Column(name = "session_id", length = 48)
    private String sessionId;

    @Column(nullable = false, length = 64)
    private String name;

    @Column(length = 20)
    private String mobile;

    @Column(nullable = false, length = 255)
    private String password;

    @Column(length = 244)
    private String email;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "role_id", nullable = false)
    private Integer roleId;

    @Column(name = "remember_me_token", length = 64)
    private String rememberMeToken;

    @Column(name = "branch_code", nullable = false, length = 11)
    private String branchCode;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "created_date", nullable = false)
    private LocalDateTime createdDate;

    @Column(name = "created_by", length = 20)
    private String createdBy;

    @Column(name = "last_login_attempt")
    private LocalDateTime lastLoginAttempt;

    @Column(name = "wrong_attempts", nullable = false)
    private Integer wrongAttempts;

    @Column(name = "last_wrong_attempt")
    private LocalDateTime lastWrongAttempt;

    @Column(name = "activation_hash", length = 40)
    private String activationHash;

    @Column(name = "password_reset_hash", length = 40)
    private String passwordResetHash;

    @Column(name = "last_password_reset_date")
    private LocalDateTime lastPasswordResetDate;

    @Column(name = "updated_date")
    private LocalDateTime updatedDate;

    @Column(name = "updated_by", length = 20)
    private String updatedBy;

    @Column(nullable = false, length = 254)
    private String domain;

    @Column(name = "provider_type", nullable = false, length = 20)
    private String providerType;

    @Column(name = "user_password_reset_timestamp", length = 50)
    private String userPasswordResetTimestamp;
}

