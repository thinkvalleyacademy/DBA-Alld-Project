package com.dba.alld.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entity for storing blacklisted/invalidated tokens.
 * Used for server-side logout functionality to prevent token reuse.
 */
@Entity
@Table(name = "token_blacklist", indexes = {
    @Index(name = "idx_token_hash", columnList = "token_hash"),
    @Index(name = "idx_expiry", columnList = "expiry_time"),
    @Index(name = "idx_user_id", columnList = "user_id")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TokenBlacklist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * SHA-256 hash of the token (never store raw tokens)
     */
    @Column(name = "token_hash", length = 255, nullable = false, unique = true)
    private String tokenHash;

    /**
     * Type of token: ACCESS or REFRESH
     */
    @Column(name = "token_type", nullable = false)
    @Enumerated(EnumType.STRING)
    private TokenType tokenType;

    /**
     * When the token expires (used for cleanup)
     */
    @Column(name = "expiry_time", nullable = false)
    private LocalDateTime expiryTime;

    /**
     * When the token was blacklisted
     */
    @Column(name = "blacklisted_at")
    private LocalDateTime blacklistedAt;

    /**
     * User ID associated with the token
     */
    @Column(name = "user_id")
    private Long userId;

    /**
     * Reason for blacklisting: LOGOUT, EXPIRED, REVOKED
     */
    @Column(name = "reason", length = 50)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private BlacklistReason reason = BlacklistReason.LOGOUT;

    /**
     * User who performed the blacklist action (for admin operations)
     */
    @Column(name = "created_by", length = 100)
    private String createdBy;

    /**
     * Token types supported
     */
    public enum TokenType {
        ACCESS,
        REFRESH
    }

    /**
     * Reasons for blacklisting a token
     */
    public enum BlacklistReason {
        LOGOUT,        // User initiated logout
        EXPIRED,       // Token expired naturally
        REVOKED,       // Admin revoked token
        SECURITY       // Security concern (e.g., suspicious activity)
    }

    @PrePersist
    public void prePersist() {
        if (blacklistedAt == null) {
            blacklistedAt = LocalDateTime.now();
        }
    }
}
