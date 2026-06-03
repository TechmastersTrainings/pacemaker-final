package com.marrow.example.dto;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter

public class ExamRequest {

    private String examTitle;

    private List<Long> questionIds;

    private Integer timeLimitMinutes;

    private Integer totalMarks;

    private String createdBy;
}