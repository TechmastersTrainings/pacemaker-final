package com.marrow.example.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter

public class AttemptRequest {

    private Long studentId;

    private Long examId;

    private String studentAnswers;
}