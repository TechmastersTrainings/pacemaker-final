package com.marrow.example.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder

public class ExamResponse {

    private Long id;

    private String title;

    private Integer totalMarks;

    private Integer timeLimit;
}