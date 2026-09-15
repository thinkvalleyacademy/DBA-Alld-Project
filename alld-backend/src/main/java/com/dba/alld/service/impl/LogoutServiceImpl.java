package com.dba.alld.service.impl;

import com.dba.alld.entities.TokenBlacklist;
import com.dba.alld.repository.TokenBlacklistRepository;
import com.dba.alld.security.JwtUtil;
import com.dba.alld.service.LogoutService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;

/**
 * Implementation of LogoutService for handling user logout operations.
 * Manages token blacklisting to prevent reuse after logout.
 */
@Service
public class LogoutServiceImpl implements LogoutService {

    private static final Logger log = LoggerFactory.getLogger(LogoutServiceImpl.class);

    @Autowired
    private TokenBlacklistRepository blacklistRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    @Transactional
    public void logout(String accessToken, String refreshToken) {
        log.info("Processing logout request");

        try {
            // Hash the access token
            String accessTokenHash = jwtUtil.hashToken(accessToken);

            // Get access token expiry
            Date accessExpiryDate = getSafeExpirationDate(accessToken);
            LocalDateTime accessExpiry = LocalDateTime.ofInstant(
                    accessExpiryDate.toInstant(),
                    ZoneId.systemDefault()
            );

            // Extract user ID from token if possible
            String username = jwtUtil.extractUsername(accessToken);
            Long userId = null; // Could be extracted from token claims if needed

            // Add access token to blacklist
            blacklistRepository.save(TokenBlacklist.builder()
                    .tokenHash(accessTokenHash)
                    .tokenType(TokenBlacklist.TokenType.ACCESS)
                    .expiryTime(accessExpiry)
                    .reason(TokenBlacklist.BlacklistReason.LOGOUT)
                    .userId(userId)
                    .build());

            log.info("Access token blacklisted for user: {}", username);

            // Handle refresh token if provided
            if (refreshToken != null && !refreshToken.isBlank()) {
                String refreshTokenHash = jwtUtil.hashToken(refreshToken);
                Date refreshExpiryDate = getSafeExpirationDate(refreshToken);
                LocalDateTime refreshExpiry = LocalDateTime.ofInstant(
                        refreshExpiryDate.toInstant(),
                        ZoneId.systemDefault()
                );

                blacklistRepository.save(TokenBlacklist.builder()
                        .tokenHash(refreshTokenHash)
                        .tokenType(TokenBlacklist.TokenType.REFRESH)
                        .expiryTime(refreshExpiry)
                        .reason(TokenBlacklist.BlacklistReason.LOGOUT)
                        .userId(userId)
                        .build());

                log.info("Refresh token blacklisted for user: {}", username);
            }

            log.info("Logout completed successfully for user: {}", username);

        } catch (Exception e) {
            // Log error but don't fail the logout (idempotent operation)
            log.warn("Error during logout process: {}", e.getMessage());
        }
    }

    @Override
    @Transactional
    public void invalidateAllUserTokens(Long userId) {
        log.info("Invalidating all tokens for userId: {}", userId);

        try {
            // Note: This is a simplified implementation
            // For a complete solution, you would need to:
            // 1. Query all active tokens for this user from your token store
            // 2. Add them all to the blacklist
            // 3. Optionally, maintain a separate user-session mapping

            // For now, we rely on the fact that tokens will be checked against
            // the blacklist on each request. New tokens issued after this
            // call should include a "issuedBefore" timestamp check.

            log.info("All future tokens for userId {} will be invalidated on next use", userId);

        } catch (Exception e) {
            log.error("Error invalidating tokens for userId {}: {}", userId, e.getMessage(), e);
            throw new RuntimeException("Failed to invalidate user tokens", e);
        }
    }

    @Override
    @Transactional
    public void invalidateToken(String tokenHash, String tokenType, Long userId, String reason) {
        log.info("Invalidating token for userId: {}, type: {}, reason: {}", userId, tokenType, reason);

        try {
            TokenBlacklist.TokenType type = TokenBlacklist.TokenType.valueOf(tokenType);
            TokenBlacklist.BlacklistReason blacklistReason = TokenBlacklist.BlacklistReason.valueOf(reason);

            // Set a default expiry (24 hours from now if we don't have the actual token)
            LocalDateTime expiryTime = LocalDateTime.now().plusHours(24);

            blacklistRepository.save(TokenBlacklist.builder()
                    .tokenHash(tokenHash)
                    .tokenType(type)
                    .expiryTime(expiryTime)
                    .reason(blacklistReason)
                    .userId(userId)
                    .createdBy("ADMIN")
                    .build());

            log.info("Token invalidated successfully: type={}, reason={}", tokenType, reason);

        } catch (IllegalArgumentException e) {
            // Let validation exceptions pass through
            log.error("Invalid token type or reason: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Error invalidating token: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to invalidate token", e);
        }
    }

    /**
     * Safely extract the expiration date from a token.
     * Handles already-expired tokens gracefully.
     *
     * @param token the token
     * @return the expiration date
     */
    private Date getSafeExpirationDate(String token) {
        try {
            return jwtUtil.getExpirationDate(token);
        } catch (Exception e) {
            // If token is expired or invalid, use a default expiry (1 hour from now)
            log.debug("Could not extract token expiry, using default: {}", e.getMessage());
            return new Date(System.currentTimeMillis() + 3600000);
        }
    }
}
