package com.dba.alld.service.impl;

import com.dba.alld.dto.GenericApiResponse;
import com.dba.alld.dto.JwtAuthResponse;
import com.dba.alld.dto.UserListResponse;
import com.dba.alld.entities.Users;
import com.dba.alld.repository.UsersRepository;
import com.dba.alld.request.LoginRequest;
import com.dba.alld.request.ResetPasswordRequest;
import com.dba.alld.request.UserRegisterRequest;
import com.dba.alld.security.JwtUtil;
import com.dba.alld.service.UserService;
import com.dba.alld.utility.Utility;
import org.jspecify.annotations.Nullable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@Service
public class UserServiceImpl implements UserService {

    static Logger log = LoggerFactory.getLogger(UserServiceImpl.class);

    @Autowired
    UsersRepository userRepository;

    @Autowired
    PasswordEncoder passwordEncoder;

    @Autowired
    Utility utility;

    @Autowired
    JwtUtil jwtUtil;

    @Override
    public @Nullable GenericApiResponse<Object> userRegistration(UserRegisterRequest registrationRequest) {
        log.info("[AUDIT] action=USER_CREATE_REQUEST userId={} roleId={} actor={}",
                registrationRequest.getUserId(),
                registrationRequest.getRoleId(),
                registrationRequest.getCreatedBy());
        String password = registrationRequest.getPassword();
        String encodedPassword = passwordEncoder.encode(password);

        Users registration = Users.builder()
                .id(registrationRequest.getId())
                .userId(registrationRequest.getUserId())
                .sessionId(registrationRequest.getSessionId())
                .name(registrationRequest.getName())
                .mobile(registrationRequest.getMobile())
                .password(encodedPassword)
                .email(registrationRequest.getEmail())
                .status(registrationRequest.getStatus() != null ? registrationRequest.getStatus() : "Active") // or "Active" if default
                .roleId(registrationRequest.getRoleId())
                .rememberMeToken(registrationRequest.getRememberMeToken())
                .branchCode(registrationRequest.getBranchCode())
                .regDate(registrationRequest.getRegDate() != null ? registrationRequest.getRegDate() : LocalDateTime.now())
                .createdDate(registrationRequest.getCreatedDate() != null ? registrationRequest.getCreatedDate() : LocalDateTime.now())
                .createdBy(registrationRequest.getCreatedBy())
                .lastLoginAttempt(registrationRequest.getLastLoginAttempt())
                .wrongAttempts(registrationRequest.getWrongAttempts() != null ? registrationRequest.getWrongAttempts() : 0)
                .lastWrongAttempt(registrationRequest.getLastWrongAttempt())
                .activationHash(registrationRequest.getActivationHash())
                .passwordResetHash(registrationRequest.getPasswordResetHash())
                .lastPasswordResetDate(registrationRequest.getLastPasswordResetDate())
                .updatedDate(registrationRequest.getUpdatedDate())
                .updatedBy(registrationRequest.getUpdatedBy())
                .domain(registrationRequest.getDomain())
                .providerType(registrationRequest.getProviderType())
                .userPasswordResetTimestamp(registrationRequest.getUserPasswordResetTimestamp())
                .build();

        userRepository.save(registration);
        log.info("[AUDIT] action=USER_CREATED userId={} roleId={} status={}",
                registration.getUserId(),
                registration.getRoleId(),
                registration.getStatus());

        return utility.buildResponse(
                "User successfully registered",
                HttpStatus.OK.value(), ""
        );
    }

    @Override
    public GenericApiResponse<Object> userLogin(LoginRequest loginRequest) {
        log.info("Login attempt for user: {}", loginRequest.getUserId());

        try {
            String userId = loginRequest.getUserId();
            String password = loginRequest.getPassword();

            log.debug("Validating login request");

            Optional<Users> userOpt = userRepository.findByUserId(userId);
            if (userOpt.isEmpty()) {
                log.warn("User '{}' not found in database", userId);
                return utility.buildResponse("Login Failed", HttpStatus.UNAUTHORIZED.value(),
                        Map.of("reason", "Invalid credentials"));
            }

            Users user = userOpt.get();

            if (!passwordEncoder.matches(password, user.getPassword())) {
                log.warn("Invalid password attempt for user '{}'", userId);
                return utility.buildResponse("Login Failed", HttpStatus.UNAUTHORIZED.value(),
                        Map.of("reason", "Invalid credentials"));
            }

            log.info("User '{}' successfully authenticated", userId);

            String accessToken = jwtUtil.generateToken(user.getUserId(), user.getRoleId(), user.getName());
            String refreshToken = jwtUtil.generateRefreshToken(user.getUserId());

            JwtAuthResponse authResponse = JwtAuthResponse.builder()
                    .accessToken(accessToken)
                    .refreshToken(refreshToken)
                    .tokenType("Bearer")
                    .id(user.getId())
                    .userId(user.getUserId())
                    .name(user.getName())
                    .email(user.getEmail())
                    .mobile(user.getMobile())
                    .roleId(user.getRoleId())
                    .status(user.getStatus())
                    .build();

            log.info("Login successful for user: {}", userId);
            return utility.buildResponse("Login Success", HttpStatus.OK.value(), authResponse);

        } catch (Exception e) {
            log.error("Error occurred during login for user '{}': {}", loginRequest.getUserId(), e.getMessage(), e);
            return utility.buildResponse("Login Failed", HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    Map.of("reason", "An error occurred"));
        }
    }
    @Override
    public @Nullable GenericApiResponse<Object> userList() {
        try {
            var users = userRepository.findAll()
                    .stream()
                    .map(user -> UserListResponse.builder()
                            .userId(user.getUserId())
                            .name(user.getName())
                            .mobile(user.getMobile())
                            .email(user.getEmail())
                            .roleId(user.getRoleId())
                            .status(user.getStatus())
                            .build())
                    .toList();
            return utility.buildResponse(
                    "Get User List",
                    HttpStatus.OK.value(),
                    users
            );
        } catch (Exception e) {
            log.error("Error fetching user list: {}", e.getMessage(), e);
            return utility.buildResponse(
                    "Failed to fetch user list",
                    HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    Map.of("error", e.getMessage())
            );
        }
    }

    @Override
    public @Nullable GenericApiResponse<Object> resetPassword(ResetPasswordRequest resetPasswordRequest) {
        String userId = resetPasswordRequest.getUserId();
        String currentPassword = resetPasswordRequest.getCurrentPassword();
        String newPassword = resetPasswordRequest.getNewPassword();

        if (userId == null || userId.isBlank() ||
                currentPassword == null || currentPassword.isBlank() ||
                newPassword == null || newPassword.isBlank()) {
            return utility.buildResponse(
                    "Invalid request",
                    HttpStatus.BAD_REQUEST.value(),
                    Map.of("reason", "userId, currentPassword and newPassword are required")
            );
        }

        Optional<Users> userOpt = userRepository.findByUserId(userId);
        if (userOpt.isEmpty()) {
            return utility.buildResponse(
                    "User not found",
                    HttpStatus.NOT_FOUND.value(),
                    Map.of("reason", "No user found for userId")
            );
        }

        Users user = userOpt.get();
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            return utility.buildResponse(
                    "Password reset failed",
                    HttpStatus.UNAUTHORIZED.value(),
                    Map.of("reason", "Current password is incorrect")
            );
        }

        if (passwordEncoder.matches(newPassword, user.getPassword())) {
            return utility.buildResponse(
                    "Password reset failed",
                    HttpStatus.BAD_REQUEST.value(),
                    Map.of("reason", "New password must be different from current password")
            );
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setUpdatedDate(LocalDateTime.now());
        user.setUpdatedBy(userId);
        userRepository.save(user);

        return utility.buildResponse(
                "Password reset successful",
                HttpStatus.OK.value(),
                Map.of("userId", userId)
        );
    }

}
