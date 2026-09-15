package com.dba.alld.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
public class ReCaptchaResponse {
    private boolean success;
    
    @JsonProperty("challenge_ts")
    private String challenge_ts;
    
    @JsonProperty("hostname")
    private String hostname;
    
    @JsonProperty("error-codes")
    private List<String> errorCodes;
    
    @JsonProperty("action")
    private String action;
    
    @JsonProperty("score")
    private Double score;
}
