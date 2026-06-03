package com.marrow.example.controller;

import com.marrow.example.dto.PerformanceResponseDto;
import com.marrow.example.dto.QueryAnalysisDto;
import com.marrow.example.dto.SlowQueryDto;
import com.marrow.example.service.PerformanceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/performance")
@RequiredArgsConstructor
@Tag(name = "Performance Tuning", description = "Admin APIs for DB Performance and Query Analysis")
public class PerformanceController {

    private final PerformanceService performanceService;

    @GetMapping("/slow-queries")
    @PreAuthorize("hasAuthority('ADMIN')")
    @Operation(summary = "Get Slow Queries")
    public ResponseEntity<List<SlowQueryDto>> getSlowQueries() {
        return ResponseEntity.ok(performanceService.getSlowQueries());
    }

    @PostMapping("/analyze")
    @PreAuthorize("hasAuthority('ADMIN')")
    @Operation(summary = "Analyze Query")
    public ResponseEntity<QueryAnalysisDto> analyzeQuery(@RequestBody Map<String, String> request) {
        String query = request.get("query");
        if (query == null || query.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(performanceService.analyzeQuery(query));
    }

    @GetMapping("/report")
    @PreAuthorize("hasAuthority('ADMIN')")
    @Operation(summary = "Get Performance Report")
    public ResponseEntity<PerformanceResponseDto> getPerformanceReport() {
        return ResponseEntity.ok(performanceService.getPerformanceReport());
    }
}
