package com.marrow.example.controller;

import com.marrow.example.dto.CacheResponseDto;
import com.marrow.example.dto.CacheStatisticsDto;
import com.marrow.example.service.CacheService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cache")
@RequiredArgsConstructor
public class CacheController {

    private final CacheService cacheService;

    @DeleteMapping("/videos")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CacheResponseDto> clearVideoCache() {
        return ResponseEntity.ok(cacheService.clearVideoCache());
    }

    @DeleteMapping("/questions")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CacheResponseDto> clearQuestionCache() {
        return ResponseEntity.ok(cacheService.clearQuestionCache());
    }

    @GetMapping("/statistics")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CacheStatisticsDto> getCacheStatistics() {
        return ResponseEntity.ok(cacheService.getCacheStatistics());
    }
}
