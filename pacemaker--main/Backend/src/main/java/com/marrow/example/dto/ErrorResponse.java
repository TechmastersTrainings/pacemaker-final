package com.marrow.example.dto;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder

public class ErrorResponse {

    private LocalDateTime timestamp;

    private Integer status;

    private String error;

    private String message;

    private String path;
}