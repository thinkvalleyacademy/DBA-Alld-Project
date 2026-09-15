package com.dba.alld.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for user logout.
 * The refresh token is optional - clients may choose to send it for complete invalidation.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LogoutRequest {

    /**
     * Optional refresh token to invalidate along with the access token.
     * If not provided, only the access token (from Authorization header) will be invalidated.
     */
    private String refreshToken;
}
