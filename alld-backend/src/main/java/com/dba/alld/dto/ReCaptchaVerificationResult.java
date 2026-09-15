package com.dba.alld.dto;

import org.springframework.http.HttpStatus;

public record ReCaptchaVerificationResult(
        boolean success,
        HttpStatus httpStatus,
        String message
) {
    public static ReCaptchaVerificationResult verified() {
        return new ReCaptchaVerificationResult(true, HttpStatus.OK, "CAPTCHA verified");
    }
}
