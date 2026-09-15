package com.dba.alld.service;

import com.dba.alld.dto.ReCaptchaResponse;
import com.dba.alld.dto.ReCaptchaVerificationResult;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestOperations;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Service
@Log4j2
public class ReCaptchaService {

    @Value("${recaptcha.secret-key}")
    private String secretKey;

    @Value("${recaptcha.verify-url}")
    private String verifyUrl;

    @Value("${recaptcha.fail-fast-on-missing-secret:false}")
    private boolean failFastOnMissingSecret;

    private final RestOperations restOperations;

    // Constructor injection for testability
    public ReCaptchaService(RestOperations restOperations) {
        this.restOperations = restOperations;
    }

    // Default constructor for Spring
    public ReCaptchaService() {
        this.restOperations = new RestTemplate();
    }

    public ReCaptchaVerificationResult verify(String token) {
        // Validate token
        if (token == null || token.trim().isEmpty()) {
            log.warn("ReCAPTCHA verification failed: captchaToken is required");
            return new ReCaptchaVerificationResult(false, HttpStatus.BAD_REQUEST, "captchaToken is required");
        }

        // Validate secret key
        if (secretKey == null || secretKey.trim().isEmpty()) {
            log.error("ReCAPTCHA secret key is not configured");
            if (failFastOnMissingSecret) {
                return new ReCaptchaVerificationResult(false, HttpStatus.INTERNAL_SERVER_ERROR, "ReCAPTCHA is not properly configured");
            }
            // In non-fail-fast mode, log and continue
            return new ReCaptchaVerificationResult(true, HttpStatus.OK, "ReCAPTCHA verification skipped: secret not configured");
        }

        try {
            // Prepare request body
            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("secret", secretKey);
            body.add("response", token);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

            // Call Google reCAPTCHA API
            ReCaptchaResponse response = restOperations.postForObject(verifyUrl, request, ReCaptchaResponse.class);

            if (response == null) {
                log.error("ReCAPTCHA API returned null response");
                return new ReCaptchaVerificationResult(false, HttpStatus.INTERNAL_SERVER_ERROR, "ReCAPTCHA service error");
            }

            // Check if verification was successful
            if (!response.isSuccess()) {
                List<String> errorCodes = response.getErrorCodes();

                // Determine error type and appropriate status
                if (errorCodes != null && !errorCodes.isEmpty()) {
                    String errorCode = errorCodes.get(0);
                    if ("timeout-or-duplicate".equals(errorCode)) {
                        log.warn("ReCAPTCHA verification failed: token timeout or duplicate");
                        return new ReCaptchaVerificationResult(false, HttpStatus.UNAUTHORIZED, "CAPTCHA token expired or already used");
                    } else if ("invalid-input-response".equals(errorCode)) {
                        log.warn("ReCAPTCHA verification failed: invalid token");
                        return new ReCaptchaVerificationResult(false, HttpStatus.UNAUTHORIZED, "Invalid CAPTCHA token");
                    }
                }

                log.warn("ReCAPTCHA verification failed with errors: {}", errorCodes);
                return new ReCaptchaVerificationResult(false, HttpStatus.UNAUTHORIZED, "CAPTCHA verification failed");
            }

            // Verification successful
            log.info("ReCAPTCHA verification successful for token from action: {}", response.getAction());
            return new ReCaptchaVerificationResult(true, HttpStatus.OK, "CAPTCHA verified");

        } catch (Exception e) {
            log.error("Error during ReCAPTCHA verification: {}", e.getMessage(), e);
            return new ReCaptchaVerificationResult(false, HttpStatus.INTERNAL_SERVER_ERROR, "ReCAPTCHA verification error: " + e.getMessage());
        }
    }

    /**
     * Convenience method for simple boolean checks (backward compatibility)
     */
    public boolean isValid(String token) {
        ReCaptchaVerificationResult result = verify(token);
        return result.success() && result.httpStatus() == HttpStatus.OK;
    }
}
