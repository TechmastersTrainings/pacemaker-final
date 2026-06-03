package com.marrow.example.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubjectPerformanceDto {
    private String subject;
    private Integer totalQuestions;
    private Integer correctAnswers;
    private Double accuracy;
    private Double score;
}
