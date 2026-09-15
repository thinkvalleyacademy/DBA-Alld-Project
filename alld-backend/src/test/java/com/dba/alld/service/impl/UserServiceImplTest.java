package com.dba.alld.service.impl;

import com.dba.alld.dto.GenericApiResponse;
import com.dba.alld.dto.JwtAuthResponse;
import com.dba.alld.entities.Users;
import com.dba.alld.repository.UsersRepository;
import com.dba.alld.request.LoginRequest;
import com.dba.alld.request.ResetPasswordRequest;
import com.dba.alld.request.UserRegisterRequest;
import com.dba.alld.security.JwtUtil;
import com.dba.alld.utility.Utility;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock
    private UsersRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private Utility utility;

    @Mock
    private JwtUtil jwtUtil;

    @InjectMocks
    private UserServiceImpl userService;

    @Test
    void userRegistration_shouldSaveEncodedPassword() {
        when(passwordEncoder.encode("plain-pass")).thenReturn("encoded-pass");
        when(userRepository.save(any(Users.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(utility.buildResponse(anyString(), anyInt(), any())).thenAnswer(invocation ->
                GenericApiResponse.builder()
                        .message(invocation.getArgument(0))
                        .status(invocation.getArgument(1))
                        .data(invocation.getArgument(2))
                        .build()
        );

        UserRegisterRequest request = UserRegisterRequest.builder()
                .userId("newuser")
                .name("New User")
                .password("plain-pass")
                .mobile("9999999999")
                .roleId(1)
                .branchCode("BR01")
                .domain("DBA")
                .providerType("LOCAL")
                .build();

        GenericApiResponse<Object> response = userService.userRegistration(request);

        assertEquals(200, response.getStatus());
        assertEquals("User successfully registered", response.getMessage());

        ArgumentCaptor<Users> userCaptor = ArgumentCaptor.forClass(Users.class);
        verify(userRepository).save(userCaptor.capture());
        assertEquals("encoded-pass", userCaptor.getValue().getPassword());
        assertEquals("newuser", userCaptor.getValue().getUserId());
    }

    @Test
    void userLogin_shouldReturnJwtTokensOnValidCredentials() {
        when(utility.buildResponse(anyString(), anyInt(), any())).thenAnswer(invocation ->
                GenericApiResponse.builder()
                        .message(invocation.getArgument(0))
                        .status(invocation.getArgument(1))
                        .data(invocation.getArgument(2))
                        .build()
        );

        Users user = new Users();
        user.setId(10);
        user.setUserId("admin");
        user.setPassword("encoded-pass");
        user.setName("Admin");
        user.setRoleId(1);
        user.setStatus("ACTIVE");
        user.setMobile("9999999999");
        user.setEmail("admin@dba.com");

        when(userRepository.findByUserId("admin")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("plain-pass", "encoded-pass")).thenReturn(true);
        when(jwtUtil.generateToken("admin", 1, "Admin")).thenReturn("access-token");
        when(jwtUtil.generateRefreshToken("admin")).thenReturn("refresh-token");

        LoginRequest request = LoginRequest.builder()
                .userId("admin")
                .password("plain-pass")
                .build();

        GenericApiResponse<Object> response = userService.userLogin(request);

        assertEquals(200, response.getStatus());
        assertEquals("Login Success", response.getMessage());
        assertNotNull(response.getData());
        assertInstanceOf(JwtAuthResponse.class, response.getData());
        JwtAuthResponse auth = (JwtAuthResponse) response.getData();
        assertEquals("access-token", auth.getAccessToken());
        assertEquals("refresh-token", auth.getRefreshToken());
        assertEquals("admin", auth.getUserId());
    }

    @Test
    void userLogin_shouldFailOnInvalidPassword() {
        when(utility.buildResponse(anyString(), anyInt(), any())).thenAnswer(invocation ->
                GenericApiResponse.builder()
                        .message(invocation.getArgument(0))
                        .status(invocation.getArgument(1))
                        .data(invocation.getArgument(2))
                        .build()
        );

        Users user = new Users();
        user.setUserId("admin");
        user.setPassword("encoded-pass");
        when(userRepository.findByUserId("admin")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong-pass", "encoded-pass")).thenReturn(false);

        LoginRequest request = LoginRequest.builder()
                .userId("admin")
                .password("wrong-pass")
                .build();

        GenericApiResponse<Object> response = userService.userLogin(request);

        assertEquals(401, response.getStatus());
        assertEquals("Login Failed", response.getMessage());
        assertInstanceOf(Map.class, response.getData());
    }

    @Test
    void resetPassword_shouldUpdatePasswordOnValidCurrentPassword() {
        when(utility.buildResponse(anyString(), anyInt(), any())).thenAnswer(invocation ->
                GenericApiResponse.builder()
                        .message(invocation.getArgument(0))
                        .status(invocation.getArgument(1))
                        .data(invocation.getArgument(2))
                        .build()
        );

        Users user = new Users();
        user.setUserId("admin");
        user.setPassword("encoded-old");

        when(userRepository.findByUserId("admin")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("old-pass", "encoded-old")).thenReturn(true);
        when(passwordEncoder.matches("new-pass", "encoded-old")).thenReturn(false);
        when(passwordEncoder.encode("new-pass")).thenReturn("encoded-new");

        ResetPasswordRequest request = ResetPasswordRequest.builder()
                .userId("admin")
                .currentPassword("old-pass")
                .newPassword("new-pass")
                .build();

        GenericApiResponse<Object> response = userService.resetPassword(request);

        assertEquals(200, response.getStatus());
        assertEquals("Password reset successful", response.getMessage());
        verify(userRepository).save(argThat(saved ->
                "encoded-new".equals(saved.getPassword()) &&
                        "admin".equals(saved.getUpdatedBy()) &&
                        saved.getUpdatedDate() != null
        ));
    }

    @Test
    void resetPassword_shouldFailWhenCurrentPasswordIsInvalid() {
        when(utility.buildResponse(anyString(), anyInt(), any())).thenAnswer(invocation ->
                GenericApiResponse.builder()
                        .message(invocation.getArgument(0))
                        .status(invocation.getArgument(1))
                        .data(invocation.getArgument(2))
                        .build()
        );

        Users user = new Users();
        user.setUserId("admin");
        user.setPassword("encoded-old");

        when(userRepository.findByUserId("admin")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong-pass", "encoded-old")).thenReturn(false);

        ResetPasswordRequest request = ResetPasswordRequest.builder()
                .userId("admin")
                .currentPassword("wrong-pass")
                .newPassword("new-pass")
                .build();

        GenericApiResponse<Object> response = userService.resetPassword(request);

        assertEquals(401, response.getStatus());
        assertEquals("Password reset failed", response.getMessage());
    }
}
