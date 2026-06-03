package com.marrow.example.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder

public class AttemptResponse {

    private Long id;

    private Integer score;

    private Long userId;

    private Long examId;
}