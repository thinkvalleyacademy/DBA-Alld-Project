package com.dba.alld.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Response DTO for user logout.
 * Contains information about the logout operation.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LogoutResponse {

    /**
     * Timestamp when the logout occurred (ISO 8601 format)
     */
    private Instant logoutTime;

    /**
     * Whether the tokens were successfully invalidated
     */
    private boolean tokensInvalidated;

    /**
     * Optional message with additional details
     */
    private String message;
}
