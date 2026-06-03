package com.marrow.example.dto;

import java.util.List;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder

public class StudentDashboardResponse {

    private Long studentId;

    private List<String> enrolledCourses;

    private List<String> recentVideos;

    private Integer totalAttempts;

    private Double averageScore;
}