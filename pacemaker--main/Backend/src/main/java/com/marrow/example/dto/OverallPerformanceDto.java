package com.marrow.example.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OverallPerformanceDto {
    private Double overallScore;
    private Double accuracyPercentage;
    private String totalTimeSpent;
    private Long attemptedQuestions;
}
