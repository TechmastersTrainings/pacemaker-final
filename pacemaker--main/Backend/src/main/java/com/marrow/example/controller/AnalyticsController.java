package com.marrow.example.controller;

import com.marrow.example.dto.StudentAnalyticsResponseDto;
import com.marrow.example.dto.SubjectPerformanceDto;
import com.marrow.example.dto.TimeSpentDto;
import com.marrow.example.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/student")
    public ResponseEntity<StudentAnalyticsResponseDto> getStudentAnalytics() {
        return ResponseEntity.ok(analyticsService.getStudentAnalytics());
    }

    @GetMapping("/subject/{subjectId}")
    public ResponseEntity<SubjectPerformanceDto> getSubjectAnalytics(@PathVariable Long subjectId) {
        return ResponseEntity.ok(analyticsService.getSubjectAnalytics(subjectId));
    }

    @GetMapping("/time-spent")
    public ResponseEntity<TimeSpentDto> getTimeSpentAnalytics() {
        return ResponseEntity.ok(analyticsService.getTimeSpentAnalytics());
    }
}
