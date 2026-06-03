package com.marrow.example.controller;

import com.marrow.example.dto.AnalyticsSummaryDto;
import com.marrow.example.service.StudentDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class StudentDashboardController {

    private final StudentDashboardService dashboardService;

    @GetMapping("/summary")
    public ResponseEntity<AnalyticsSummaryDto> getDashboardSummary() {
        return ResponseEntity.ok(dashboardService.getDashboardSummary());
    }
}