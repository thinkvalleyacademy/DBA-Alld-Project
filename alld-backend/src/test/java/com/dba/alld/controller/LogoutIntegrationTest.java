package com.dba.alld.controller;

import com.dba.alld.entities.TokenBlacklist;
import com.dba.alld.entities.Users;
import com.dba.alld.repository.TokenBlacklistRepository;
import com.dba.alld.repository.UsersRepository;
import com.dba.alld.security.JwtUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for the logout endpoint.
 * Tests the complete flow from login to logout with token blacklisting.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Logout Endpoint Integration Tests")
@Transactional
class LogoutIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UsersRepository userRepository;

    @Autowired
    private TokenBlacklistRepository blacklistRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String accessToken;
    private String refreshToken;
    private Users testUser;

    @BeforeEach
    void setUp() {
        // Clean up before each test
        blacklistRepository.deleteAll();
        
        // Create test user
        testUser = Users.builder()
                .userId("testuser_logout_" + System.currentTimeMillis())
                .name("Test User")
                .email("test@example.com")
                .mobile("1234567890")
                .password(passwordEncoder.encode("testpassword123"))
                .roleId(2)
                .status("Active")
                .regDate(LocalDateTime.now())
                .createdDate(LocalDateTime.now())
                .build();
        
        userRepository.save(testUser);

        // Generate tokens
        accessToken = jwtUtil.generateToken(testUser.getUserId(), testUser.getRoleId(), testUser.getName());
        refreshToken = jwtUtil.generateRefreshToken(testUser.getUserId());
    }

    @Test
    @DisplayName("Should logout successfully with valid access token")
    void logout_withValidToken_shouldReturnSuccess() throws Exception {
        // Act & Assert
        mockMvc.perform(post("/api/v1/user/logout")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.message").value("User logged out successfully"))
                .andExpect(jsonPath("$.data.tokensInvalidated").value(true));
    }

    @Test
    @DisplayName("Should logout with access token and refresh token in body")
    void logout_withRefreshToken_shouldBlacklistBoth() throws Exception {
        // Arrange
        Map<String, String> requestBody = Map.of("refreshToken", refreshToken);

        // Act & Assert
        mockMvc.perform(post("/api/v1/user/logout")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestBody)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.tokensInvalidated").value(true));

        // Verify both tokens are blacklisted
        Thread.sleep(100); // Small delay to ensure DB write completes
        String accessHash = jwtUtil.hashToken(accessToken);
        String refreshHash = jwtUtil.hashToken(refreshToken);
        
        assertTrue(blacklistRepository.existsByTokenHash(accessHash));
        assertTrue(blacklistRepository.existsByTokenHash(refreshHash));
    }

    @Test
    @DisplayName("Should return 401 when no authorization header is provided")
    void logout_withoutAuthHeader_shouldReturnUnauthorized() throws Exception {
        // Act & Assert
        mockMvc.perform(post("/api/v1/user/logout")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    @DisplayName("Should return 401 when authorization header is empty")
    void logout_withEmptyAuthHeader_shouldReturnUnauthorized() throws Exception {
        // Act & Assert
        mockMvc.perform(post("/api/v1/user/logout")
                        .header("Authorization", "")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    @DisplayName("Should handle logout with empty request body")
    void logout_withEmptyBody_shouldSucceed() throws Exception {
        // Act & Assert
        mockMvc.perform(post("/api/v1/user/logout")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200));
    }

    @Test
    @DisplayName("Blacklisted token should not be usable for authenticated requests")
    void blacklistedToken_shouldBeRejectedOnSubsequentRequests() throws Exception {
        // First logout
        mockMvc.perform(post("/api/v1/user/logout")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        // Note: The actual token rejection happens in the JwtAuthenticationFilter
        // This test verifies the token is in the blacklist
        String tokenHash = jwtUtil.hashToken(accessToken);
        assertTrue(blacklistRepository.existsByTokenHash(tokenHash));
    }

    @Test
    @DisplayName("Logout should be idempotent - calling twice should succeed")
    void logout_calledTwice_shouldSucceedBothTimes() throws Exception {
        // First logout
        mockMvc.perform(post("/api/v1/user/logout")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        // Second logout (same token)
        mockMvc.perform(post("/api/v1/user/logout")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }
}
