package com.marrow.example.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsSummaryDto {
    private Double overallScore;
    private String performanceLevel;
    private Integer completedActivities;
    private String totalTimeSpent;
}
