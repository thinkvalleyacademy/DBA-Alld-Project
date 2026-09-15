package com.dba.alld.utility;

import com.dba.alld.dto.GenericApiResponse;
import org.springframework.stereotype.Component;

@Component
public class Utility {

    public GenericApiResponse<Object> buildResponse(String message, int status, Object data) {

        return GenericApiResponse.builder()
                .message(message)
                .data(data)
                .status(status)
                .build();
    }
}
