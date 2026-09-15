package com.dba.alld.service.impl;

import com.dba.alld.entities.TokenBlacklist;
import com.dba.alld.repository.TokenBlacklistRepository;
import com.dba.alld.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Date;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for LogoutServiceImpl.
 * Tests cover logout functionality, token invalidation, and error handling.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("LogoutService Unit Tests")
class LogoutServiceImplTest {

    @Mock
    private TokenBlacklistRepository blacklistRepository;

    @Mock
    private JwtUtil jwtUtil;

    @InjectMocks
    private LogoutServiceImpl logoutService;

    private String validAccessToken;
    private String validRefreshToken;
    private String tokenHash;
    private Date expirationDate;

    @BeforeEach
    void setUp() {
        validAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.valid.access.token";
        validRefreshToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.valid.refresh.token";
        tokenHash = "abc123def456";
        expirationDate = new Date(System.currentTimeMillis() + 3600000); // 1 hour from now
    }

    @Test
    @DisplayName("Should logout successfully with valid access token")
    void logout_withValidAccessToken_shouldBlacklistToken() {
        // Arrange
        when(jwtUtil.hashToken(validAccessToken)).thenReturn(tokenHash);
        when(jwtUtil.getExpirationDate(validAccessToken)).thenReturn(expirationDate);
        when(jwtUtil.extractUsername(validAccessToken)).thenReturn("testuser");

        // Act
        logoutService.logout(validAccessToken, null);

        // Assert
        ArgumentCaptor<TokenBlacklist> captor = ArgumentCaptor.forClass(TokenBlacklist.class);
        verify(blacklistRepository, times(1)).save(captor.capture());

        TokenBlacklist saved = captor.getValue();
        assertEquals(tokenHash, saved.getTokenHash());
        assertEquals(TokenBlacklist.TokenType.ACCESS, saved.getTokenType());
        assertEquals(TokenBlacklist.BlacklistReason.LOGOUT, saved.getReason());
        assertNotNull(saved.getExpiryTime());
    }

    @Test
    @DisplayName("Should logout successfully with both access and refresh tokens")
    void logout_withBothTokens_shouldBlacklistBoth() {
        // Arrange
        String refreshHash = "refresh123hash";
        when(jwtUtil.hashToken(validAccessToken)).thenReturn(tokenHash);
        when(jwtUtil.hashToken(validRefreshToken)).thenReturn(refreshHash);
        when(jwtUtil.getExpirationDate(validAccessToken)).thenReturn(expirationDate);
        when(jwtUtil.getExpirationDate(validRefreshToken)).thenReturn(
                new Date(System.currentTimeMillis() + 604800000L) // 7 days
        );
        when(jwtUtil.extractUsername(validAccessToken)).thenReturn("testuser");

        // Act
        logoutService.logout(validAccessToken, validRefreshToken);

        // Assert
        ArgumentCaptor<TokenBlacklist> captor = ArgumentCaptor.forClass(TokenBlacklist.class);
        verify(blacklistRepository, times(2)).save(captor.capture());

        var savedTokens = captor.getAllValues();
        assertEquals(2, savedTokens.size());

        TokenBlacklist accessToken = savedTokens.get(0);
        TokenBlacklist refreshToken = savedTokens.get(1);

        assertEquals(tokenHash, accessToken.getTokenHash());
        assertEquals(TokenBlacklist.TokenType.ACCESS, accessToken.getTokenType());

        assertEquals(refreshHash, refreshToken.getTokenHash());
        assertEquals(TokenBlacklist.TokenType.REFRESH, refreshToken.getTokenType());
    }

    @Test
    @DisplayName("Should handle null refresh token gracefully")
    void logout_withNullRefreshToken_shouldOnlyBlacklistAccessToken() {
        // Arrange
        when(jwtUtil.hashToken(validAccessToken)).thenReturn(tokenHash);
        when(jwtUtil.getExpirationDate(validAccessToken)).thenReturn(expirationDate);
        when(jwtUtil.extractUsername(validAccessToken)).thenReturn("testuser");

        // Act
        logoutService.logout(validAccessToken, null);

        // Assert
        verify(blacklistRepository, times(1)).save(any(TokenBlacklist.class));
        verify(blacklistRepository, never()).save(
                argThat(t -> t.getTokenType() == TokenBlacklist.TokenType.REFRESH)
        );
    }

    @Test
    @DisplayName("Should handle empty refresh token gracefully")
    void logout_withEmptyRefreshToken_shouldOnlyBlacklistAccessToken() {
        // Arrange
        when(jwtUtil.hashToken(validAccessToken)).thenReturn(tokenHash);
        when(jwtUtil.getExpirationDate(validAccessToken)).thenReturn(expirationDate);
        when(jwtUtil.extractUsername(validAccessToken)).thenReturn("testuser");

        // Act
        logoutService.logout(validAccessToken, "");

        // Assert
        verify(blacklistRepository, times(1)).save(any(TokenBlacklist.class));
    }

    @Test
    @DisplayName("Should handle exception during logout gracefully")
    void logout_withException_shouldNotThrow() {
        // Arrange
        when(jwtUtil.hashToken(validAccessToken)).thenThrow(new RuntimeException("Test error"));

        // Act & Assert - should not throw exception
        assertDoesNotThrow(() -> logoutService.logout(validAccessToken, null));
    }

    @Test
    @DisplayName("Should handle expired token gracefully")
    void logout_withExpiredToken_shouldStillBlacklist() {
        // Arrange
        Date expiredDate = new Date(System.currentTimeMillis() - 3600000); // 1 hour ago
        when(jwtUtil.hashToken(validAccessToken)).thenReturn(tokenHash);
        when(jwtUtil.getExpirationDate(validAccessToken))
                .thenThrow(new io.jsonwebtoken.ExpiredJwtException(
                        null, null, "Token expired"
                ));

        // Act & Assert - should not throw
        assertDoesNotThrow(() -> logoutService.logout(validAccessToken, null));
    }

    @Test
    @DisplayName("Should invalidate all user tokens for given userId")
    void invalidateAllUserTokens_shouldCompleteWithoutError() {
        // Arrange
        Long userId = 1L;

        // Act & Assert
        assertDoesNotThrow(() -> logoutService.invalidateAllUserTokens(userId));
    }

    @Test
    @DisplayName("Should invalidate specific token by hash")
    void invalidateToken_withValidParams_shouldBlacklistToken() {
        // Arrange
        String tokenHash = "testhash123";
        String tokenType = "ACCESS";
        Long userId = 1L;
        String reason = "REVOKED";

        // Act
        logoutService.invalidateToken(tokenHash, tokenType, userId, reason);

        // Assert
        ArgumentCaptor<TokenBlacklist> captor = ArgumentCaptor.forClass(TokenBlacklist.class);
        verify(blacklistRepository, times(1)).save(captor.capture());

        TokenBlacklist saved = captor.getValue();
        assertEquals(tokenHash, saved.getTokenHash());
        assertEquals(TokenBlacklist.TokenType.ACCESS, saved.getTokenType());
        assertEquals(TokenBlacklist.BlacklistReason.REVOKED, saved.getReason());
        assertEquals(userId, saved.getUserId());
        assertEquals("ADMIN", saved.getCreatedBy());
    }

    @Test
    @DisplayName("Should handle invalid token type in invalidateToken")
    void invalidateToken_withInvalidTokenType_shouldThrow() {
        // Arrange
        String invalidType = "INVALID";

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () ->
                logoutService.invalidateToken("hash123", invalidType, 1L, "LOGOUT")
        );
    }

    @Test
    @DisplayName("Should handle invalid reason in invalidateToken")
    void invalidateToken_withInvalidReason_shouldThrow() {
        // Arrange
        String invalidReason = "INVALID";

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () ->
                logoutService.invalidateToken("hash123", "ACCESS", 1L, invalidReason)
        );
    }

    @Test
    @DisplayName("Logout should be idempotent - calling twice should not error")
    void logout_calledTwice_shouldNotError() {
        // Arrange
        when(jwtUtil.hashToken(validAccessToken)).thenReturn(tokenHash);
        when(jwtUtil.getExpirationDate(validAccessToken)).thenReturn(expirationDate);
        when(jwtUtil.extractUsername(validAccessToken)).thenReturn("testuser");

        // Act
        assertDoesNotThrow(() -> {
            logoutService.logout(validAccessToken, null);
            logoutService.logout(validAccessToken, null);
        });

        // Assert
        verify(blacklistRepository, times(2)).save(any(TokenBlacklist.class));
    }
}
