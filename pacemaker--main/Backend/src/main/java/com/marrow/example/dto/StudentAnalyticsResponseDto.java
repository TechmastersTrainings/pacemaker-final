package com.marrow.example.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentAnalyticsResponseDto {
    private Double overallScore;
    private Double accuracyPercentage;
    private String totalTimeSpent;
    private Long attemptedQuestions;
    private List<String> strongSubjects;
    private List<String> weakSubjects;
}
