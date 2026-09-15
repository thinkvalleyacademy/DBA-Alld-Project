package com.dba.alld.service;

/**
 * Service interface for handling user logout operations.
 * Provides methods for token invalidation and session termination.
 */
public interface LogoutService {

    /**
     * Perform logout by invalidating the provided tokens.
     * Adds tokens to the blacklist to prevent reuse.
     *
     * @param accessToken  the access token to invalidate
     * @param refreshToken the refresh token to invalidate (can be null)
     */
    void logout(String accessToken, String refreshToken);

    /**
     * Invalidate all tokens for a specific user.
     * Used for admin force-logout operations.
     *
     * @param userId the user ID whose tokens should be invalidated
     */
    void invalidateAllUserTokens(Long userId);

    /**
     * Invalidate a specific token by its hash.
     * Used for targeted token revocation.
     *
     * @param tokenHash the SHA-256 hash of the token
     * @param tokenType the type of token (ACCESS or REFRESH)
     * @param userId    the user ID associated with the token
     * @param reason    the reason for blacklisting
     */
    void invalidateToken(String tokenHash, String tokenType, Long userId, String reason);
}
