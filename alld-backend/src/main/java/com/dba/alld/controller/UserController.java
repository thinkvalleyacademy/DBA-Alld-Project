package com.dba.alld.controller;

import com.dba.alld.dto.GenericApiResponse;
import com.dba.alld.dto.LogoutRequest;
import com.dba.alld.dto.LogoutResponse;
import com.dba.alld.request.LoginRequest;
import com.dba.alld.request.ResetPasswordRequest;
import com.dba.alld.request.UserRegisterRequest;
import com.dba.alld.service.LogoutService;
import com.dba.alld.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.headers.Header;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/user")
public class UserController {

    @Autowired
    UserService userService;

    @Autowired
    LogoutService logoutService;

    static Logger log = LoggerFactory.getLogger(UserController.class);

    @PostMapping("/login")
    @Operation(summary = "User Login",
    description = "User login and fetch data of user",
    requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "user login request",
            required = true,
            content = @Content(mediaType = "application/json",
                        schema = @Schema(implementation = LoginRequest.class),
                        examples = @ExampleObject(name = "Sample Login Request",
                                value = """
                                            {
                                                "username": "mukeshkumar2025FhJ",
                                                "password": "mukesh042025",
                                                "username":"johndoe2005wZi",
                                                "password":"john082005",
                                                "username":"johnteacher2005ilH",
                                                "password":"john082005"
                                                }
                                            """))),
            responses = @ApiResponse( responseCode = "200",
                    description = "Successful login",
                    headers = @Header(name = "Authorization",
                                    description = "Bearer Token for Authentication",
                                    schema = @Schema(type = "string")))
    )
    public ResponseEntity<GenericApiResponse<Object>> loginUser(@RequestBody LoginRequest loginRequest) throws Exception {
        log.info("User login request received..!!");
        return ResponseEntity.ok(userService.userLogin(loginRequest));
    }

    @PostMapping("/logout")
    @Operation(
            summary = "User Logout",
            description = "Invalidate user tokens and terminate session on server side. " +
                         "The access token from the Authorization header will be blacklisted. " +
                         "Optionally, a refresh token can be provided in the request body for complete invalidation.",
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "Optional refresh token for invalidation",
                    required = false,
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = LogoutRequest.class),
                            examples = @ExampleObject(
                                    name = "Sample Logout Request",
                                    value = "{\"refreshToken\": \"your-refresh-token-here\"}"
                            )
                    )
            ),
            responses = {
                @ApiResponse(
                    responseCode = "200",
                    description = "User logged out successfully",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = GenericApiResponse.class),
                            examples = @ExampleObject(
                                    name = "Success Response",
                                    value = """
                                            {
                                                "success": true,
                                                "message": "User logged out successfully",
                                                "data": {
                                                    "logoutTime": "2024-01-15T10:30:00Z",
                                                    "tokensInvalidated": true
                                                }
                                            }
                                            """
                            )
                    )
                ),
                @ApiResponse(
                    responseCode = "401",
                    description = "Invalid or expired token",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    name = "Unauthorized Response",
                                    value = """
                                            {
                                                "success": false,
                                                "message": "Invalid or expired token",
                                                "error": "UNAUTHORIZED"
                                            }
                                            """
                            )
                    )
                )
            }
    )
    public ResponseEntity<GenericApiResponse<Object>> logout(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody(required = false) LogoutRequest request) {

        log.info("Logout request received");

        try {
            // Extract token from "Bearer <token>"
            String accessToken = null;
            if (authorization != null && authorization.startsWith("Bearer ")) {
                accessToken = authorization.substring(7);
            }

            if (accessToken == null || accessToken.isBlank()) {
                log.warn("No access token provided in logout request");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(GenericApiResponse.builder()
                                .status(HttpStatus.UNAUTHORIZED.value())
                                .message("Access token required")
                                .data(Map.of("error", "MISSING_TOKEN"))
                                .build());
            }

            // Get refresh token from request (optional)
            String refreshToken = request != null ? request.getRefreshToken() : null;

            // Perform logout - invalidate tokens
            logoutService.logout(accessToken, refreshToken);

            // Build success response
            LogoutResponse response = LogoutResponse.builder()
                    .logoutTime(Instant.now())
                    .tokensInvalidated(true)
                    .message("User logged out successfully")
                    .build();

            log.info("User logged out successfully");

            return ResponseEntity.ok(GenericApiResponse.builder()
                    .status(HttpStatus.OK.value())
                    .message("User logged out successfully")
                    .data(response)
                    .build());

        } catch (Exception e) {
            // Log error but return success (idempotent operation)
            log.warn("Logout error (idempotent - returning success): {}", e.getMessage());

            // Still return success to allow frontend to proceed with cleanup
            LogoutResponse response = LogoutResponse.builder()
                    .logoutTime(Instant.now())
                    .tokensInvalidated(false)
                    .message("Logout completed with warnings")
                    .build();

            return ResponseEntity.ok(GenericApiResponse.builder()
                    .status(HttpStatus.OK.value())
                    .message("Logout completed")
                    .data(response)
                    .build());
        }
    }

    @PostMapping("/register")
    public ResponseEntity<GenericApiResponse<Object>> registerUser(
            @RequestBody UserRegisterRequest registrationRequest
    ) throws Exception {
        log.info("User registration request received..!!");
        return ResponseEntity.ok(userService.userRegistration(registrationRequest));
    }

    @PostMapping("/list")
    public ResponseEntity<GenericApiResponse<Object>> getAllUsers() throws Exception{
        return ResponseEntity.ok(userService.userList());
    }

    @PostMapping("/reset-password")
    public ResponseEntity<GenericApiResponse<Object>> resetPassword(
            @RequestBody ResetPasswordRequest resetPasswordRequest
    ) throws Exception {
        log.info("Password reset request received for userId={}", resetPasswordRequest.getUserId());
        return ResponseEntity.ok(userService.resetPassword(resetPasswordRequest));
    }
}
