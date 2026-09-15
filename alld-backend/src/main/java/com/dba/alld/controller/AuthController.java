package com.dba.alld.controller;

import com.dba.alld.dto.GenericApiResponse;
import com.dba.alld.dto.JwtAuthResponse;
import com.dba.alld.entities.Users;
import com.dba.alld.repository.UsersRepository;
import com.dba.alld.request.LoginRequest;
import com.dba.alld.request.RefreshTokenRequest;
import com.dba.alld.request.UserRegisterRequest;
import com.dba.alld.security.JwtUtil;
import com.dba.alld.service.UserService;
import com.dba.alld.utility.Utility;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication", description = "JWT Authentication APIs")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UsersRepository usersRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private Utility utility;

    @PostMapping("/login")
    @Operation(
            summary = "User Login with JWT",
            description = "Authenticate user and return JWT access and refresh tokens",
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "Login credentials",
                    required = true,
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = LoginRequest.class),
                            examples = @ExampleObject(
                                    name = "Sample Login",
                                    value = """
                                            {
                                                "userId": "johndoe2005wZi",
                                                "password": "john082005"
                                            }
                                            """
                            )
                    )
            ),
            responses = {
                    @ApiResponse(
                            responseCode = "200",
                            description = "Successfully authenticated",
                            content = @Content(schema = @Schema(implementation = JwtAuthResponse.class))
                    ),
                    @ApiResponse(responseCode = "401", description = "Invalid credentials")
            }
    )
    public ResponseEntity<GenericApiResponse<Object>> login(@RequestBody LoginRequest loginRequest) {
        log.info("JWT Login attempt for user: {}", loginRequest.getUserId());

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getUserId(),
                            loginRequest.getPassword()
                    )
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);

            Optional<Users> userOpt = usersRepository.findByUserId(loginRequest.getUserId());
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(utility.buildResponse("User not found", HttpStatus.UNAUTHORIZED.value(), null));
            }

            Users user = userOpt.get();

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

            log.info("JWT Login successful for user: {}", loginRequest.getUserId());
            return ResponseEntity.ok(utility.buildResponse("Login successful", HttpStatus.OK.value(), authResponse));

        } catch (BadCredentialsException e) {
            log.warn("Invalid credentials for user: {}", loginRequest.getUserId());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(utility.buildResponse("Invalid credentials", HttpStatus.UNAUTHORIZED.value(),
                            Map.of("reason", "Invalid userId or password")));
        } catch (Exception e) {
            log.error("Login error for user {}: {}", loginRequest.getUserId(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(utility.buildResponse("Login failed", HttpStatus.INTERNAL_SERVER_ERROR.value(),
                            Map.of("reason", "An error occurred")));
        }
    }

    @PostMapping("/register")
    @Operation(
            summary = "Register new user",
            description = "Register a new user account"
    )
    public ResponseEntity<GenericApiResponse<Object>> register(@RequestBody UserRegisterRequest registrationRequest) {
        log.info("User registration request received for: {}", registrationRequest.getUserId());
        return ResponseEntity.ok(userService.userRegistration(registrationRequest));
    }

    @PostMapping("/refresh")
    @Operation(
            summary = "Refresh Access Token",
            description = "Get a new access token using refresh token",
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "Refresh token",
                    required = true,
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = RefreshTokenRequest.class)
                    )
            )
    )
    public ResponseEntity<GenericApiResponse<Object>> refreshToken(@RequestBody RefreshTokenRequest request) {
        log.info("Token refresh request received");

        try {
            String refreshToken = request.getRefreshToken();

            if (!jwtUtil.validateToken(refreshToken)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(utility.buildResponse("Invalid refresh token", HttpStatus.UNAUTHORIZED.value(), null));
            }

            String username = jwtUtil.extractUsername(refreshToken);
            Optional<Users> userOpt = usersRepository.findByUserId(username);

            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(utility.buildResponse("User not found", HttpStatus.UNAUTHORIZED.value(), null));
            }

            Users user = userOpt.get();
            String newAccessToken = jwtUtil.generateToken(user.getUserId(), user.getRoleId(), user.getName());

            JwtAuthResponse authResponse = JwtAuthResponse.builder()
                    .accessToken(newAccessToken)
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

            log.info("Token refreshed successfully for user: {}", username);
            return ResponseEntity.ok(utility.buildResponse("Token refreshed", HttpStatus.OK.value(), authResponse));

        } catch (Exception e) {
            log.error("Token refresh error: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(utility.buildResponse("Token refresh failed", HttpStatus.INTERNAL_SERVER_ERROR.value(),
                            Map.of("reason", "An error occurred")));
        }
    }
}
