package com.dba.alld.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class GenericApiResponse<T> {
    private int status;
    private String message;
    private T data;
}
