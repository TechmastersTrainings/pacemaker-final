package com.marrow.example.controller;

import com.marrow.example.dto.BadgeResponseDto;
import com.marrow.example.service.BadgeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/badges")
@RequiredArgsConstructor
@Tag(name = "Badge Management API", description = "Endpoints for managing and viewing platform badges")
public class BadgeController {

    private final BadgeService badgeService;

    @GetMapping
    @Operation(summary = "Get all available platform badges")
    public ResponseEntity<List<BadgeResponseDto>> getAllBadges() {
        return ResponseEntity.ok(badgeService.getAllBadges());
    }
}
