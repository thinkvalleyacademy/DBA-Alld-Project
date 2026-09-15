package com.dba.alld.controller;

import com.dba.alld.dto.GenericApiResponse;
import com.dba.alld.dto.ReCaptchaVerificationResult;
import com.dba.alld.service.MemberService;
import com.dba.alld.service.ReCaptchaService;
import com.dba.alld.utility.Utility;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class MemberControllerGeneralSearchTest {

    @Mock
    private MemberService memberService;

    @Mock
    private ReCaptchaService reCaptchaService;

    @Mock
    private Utility utility;

    @InjectMocks
    private MemberController memberController;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(memberController).build();
    }

    @Test
    void generalSearch_shouldReturnResults_whenCaptchaTokenIsValid() throws Exception {
        GenericApiResponse<Object> serviceResponse = GenericApiResponse.builder()
                .status(200)
                .message("Search Results")
                .data(List.of(Map.of("memberId", "POR00000001", "name", "John")))
                .build();

        when(reCaptchaService.verify("valid-token"))
                .thenReturn(ReCaptchaVerificationResult.verified());
        when(memberService.searchMembers("jo", null)).thenReturn(serviceResponse);

        mockMvc.perform(get("/api/v1/members/generalsearch")
                        .param("query", "jo")
                        .param("captchaToken", "valid-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.message").value("Search Results"))
                .andExpect(jsonPath("$.data[0].memberId").value("POR00000001"));

        verify(memberService).searchMembers("jo", null);
    }

    @Test
    void generalSearch_shouldReturn401_whenCaptchaTokenIsInvalid() throws Exception {
        when(reCaptchaService.verify("invalid-token")).thenReturn(
                new ReCaptchaVerificationResult(false, HttpStatus.UNAUTHORIZED, "Invalid CAPTCHA token")
        );
        when(utility.buildResponse(eq("ERROR"), eq(401), eq("Invalid CAPTCHA token"))).thenReturn(
                GenericApiResponse.builder()
                        .status(401)
                        .message("ERROR")
                        .data("Invalid CAPTCHA token")
                        .build()
        );

        mockMvc.perform(get("/api/v1/members/generalsearch")
                        .param("query", "jo")
                        .param("captchaToken", "invalid-token"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.data").value("Invalid CAPTCHA token"));

        verify(memberService, never()).searchMembers(anyString(), any());
    }

    @Test
    void generalSearch_shouldReturn400_whenCaptchaTokenIsMissing() throws Exception {
        when(reCaptchaService.verify(null)).thenReturn(
                new ReCaptchaVerificationResult(false, HttpStatus.BAD_REQUEST, "captchaToken is required")
        );
        when(utility.buildResponse(eq("ERROR"), eq(400), eq("captchaToken is required"))).thenReturn(
                GenericApiResponse.builder()
                        .status(400)
                        .message("ERROR")
                        .data("captchaToken is required")
                        .build()
        );

        mockMvc.perform(get("/api/v1/members/generalsearch")
                        .param("query", "jo"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.data").value("captchaToken is required"));

        verify(memberService, never()).searchMembers(anyString(), any());
    }

    @Test
    void generalSearch_shouldReturn401_whenCaptchaTokenIsExpiredOrReused() throws Exception {
        when(reCaptchaService.verify("expired-token")).thenReturn(
                new ReCaptchaVerificationResult(false, HttpStatus.UNAUTHORIZED, "CAPTCHA token expired or already used")
        );
        when(utility.buildResponse(eq("ERROR"), eq(401), eq("CAPTCHA token expired or already used"))).thenReturn(
                GenericApiResponse.builder()
                        .status(401)
                        .message("ERROR")
                        .data("CAPTCHA token expired or already used")
                        .build()
        );

        mockMvc.perform(get("/api/v1/members/generalsearch")
                        .param("query", "jo")
                        .param("captchaToken", "expired-token"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.data").value("CAPTCHA token expired or already used"));

        verify(memberService, never()).searchMembers(anyString(), any());
    }

    @Test
    void generalSearch_shouldReturnEmptyData_whenCaptchaTokenIsValidAndNoResults() throws Exception {
        GenericApiResponse<Object> serviceResponse = GenericApiResponse.builder()
                .status(200)
                .message("Search Results")
                .data(List.of())
                .build();

        when(reCaptchaService.verify("valid-token"))
                .thenReturn(ReCaptchaVerificationResult.verified());
        when(memberService.searchMembers("unknown", 1)).thenReturn(serviceResponse);

        mockMvc.perform(get("/api/v1/members/generalsearch")
                        .param("query", "unknown")
                        .param("type", "1")
                        .param("captchaToken", "valid-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.message").value("Search Results"))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data").isEmpty());

        verify(memberService).searchMembers("unknown", 1);
    }

    @Test
    void bulkStatusUpdate_shouldAcceptNewStatusPayloadKey() throws Exception {
        GenericApiResponse<Object> serviceResponse = GenericApiResponse.builder()
                .status(200)
                .message("Bulk status update completed")
                .data(Map.of("successCount", 1, "newStatus", "INACTIVE"))
                .build();

        when(memberService.bulkUpdateMemberStatus(List.of("POR00002575"), "INACTIVE"))
                .thenReturn(serviceResponse);

        mockMvc.perform(put("/api/v1/members/bulk-status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "memberIds": ["POR00002575"],
                                  "newStatus": "INACTIVE"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.newStatus").value("INACTIVE"));

        verify(memberService).bulkUpdateMemberStatus(List.of("POR00002575"), "INACTIVE");
    }

    @Test
    void singleStatusUpdate_shouldAcceptNewStatusPayloadKey() throws Exception {
        GenericApiResponse<Object> serviceResponse = GenericApiResponse.builder()
                .status(200)
                .message("Member status updated successfully")
                .data(Map.of("memberId", "POR00002575", "newStatus", "DELETED"))
                .build();

        when(memberService.updateMemberStatus("POR00002575", "DELETED"))
                .thenReturn(serviceResponse);

        mockMvc.perform(put("/api/v1/members/POR00002575/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "newStatus": "DELETED"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.newStatus").value("DELETED"));

        verify(memberService).updateMemberStatus("POR00002575", "DELETED");
    }
}
