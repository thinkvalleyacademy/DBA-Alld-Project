package com.dba.alld.service;

import com.dba.alld.dto.ReCaptchaResponse;
import com.dba.alld.dto.ReCaptchaVerificationResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestOperations;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReCaptchaServiceTest {

    @Mock
    private RestOperations restOperations;

    private ReCaptchaService reCaptchaService;

    @BeforeEach
    void setUp() {
        reCaptchaService = new ReCaptchaService(restOperations);
        ReflectionTestUtils.setField(reCaptchaService, "secretKey", "test-secret");
        ReflectionTestUtils.setField(reCaptchaService, "verifyUrl", "https://www.google.com/recaptcha/api/siteverify");
        ReflectionTestUtils.setField(reCaptchaService, "failFastOnMissingSecret", true);
    }

    @Test
    void verify_shouldReturn400_whenTokenIsMissing() {
        ReCaptchaVerificationResult result = reCaptchaService.verify(null);

        assertFalse(result.success());
        assertEquals(HttpStatus.BAD_REQUEST, result.httpStatus());
        assertEquals("captchaToken is required", result.message());
    }

    @Test
    void verify_shouldReturn401_whenTokenIsExpiredOrReused() {
        ReCaptchaResponse googleResponse = new ReCaptchaResponse();
        googleResponse.setSuccess(false);
        googleResponse.setErrorCodes(List.of("timeout-or-duplicate"));

        when(restOperations.postForObject(eq("https://www.google.com/recaptcha/api/siteverify"), any(HttpEntity.class), eq(ReCaptchaResponse.class)))
                .thenReturn(googleResponse);

        ReCaptchaVerificationResult result = reCaptchaService.verify("expired-token");

        assertFalse(result.success());
        assertEquals(HttpStatus.UNAUTHORIZED, result.httpStatus());
        assertEquals("CAPTCHA token expired or already used", result.message());
    }

    @Test
    void verify_shouldReturn401_whenTokenIsInvalid() {
        ReCaptchaResponse googleResponse = new ReCaptchaResponse();
        googleResponse.setSuccess(false);
        googleResponse.setErrorCodes(List.of("invalid-input-response"));

        when(restOperations.postForObject(eq("https://www.google.com/recaptcha/api/siteverify"), any(HttpEntity.class), eq(ReCaptchaResponse.class)))
                .thenReturn(googleResponse);

        ReCaptchaVerificationResult result = reCaptchaService.verify("invalid-token");

        assertFalse(result.success());
        assertEquals(HttpStatus.UNAUTHORIZED, result.httpStatus());
        assertEquals("Invalid CAPTCHA token", result.message());
    }

    @Test
    void verify_shouldReturnSuccess_whenGoogleSaysSuccess() {
        ReCaptchaResponse googleResponse = new ReCaptchaResponse();
        googleResponse.setSuccess(true);

        when(restOperations.postForObject(eq("https://www.google.com/recaptcha/api/siteverify"), any(HttpEntity.class), eq(ReCaptchaResponse.class)))
                .thenReturn(googleResponse);

        ReCaptchaVerificationResult result = reCaptchaService.verify("valid-token");

        assertTrue(result.success());
        assertEquals(HttpStatus.OK, result.httpStatus());
    }
}
