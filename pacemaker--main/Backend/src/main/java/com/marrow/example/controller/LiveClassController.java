package com.marrow.example.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.marrow.example.dto.ApiResponse;
import com.marrow.example.dto.LiveClassRequest;
import com.marrow.example.entity.LiveClass;
import com.marrow.example.service.LiveClassService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/live-classes")
@RequiredArgsConstructor
public class LiveClassController {

    private final LiveClassService liveClassService;

    @PostMapping
    public ResponseEntity<ApiResponse<LiveClass>> createLiveClass(@RequestBody LiveClassRequest request) {
        LiveClass liveClass = liveClassService.createLiveClass(request);
        return ResponseEntity.ok(ApiResponse.success("Live class created successfully", liveClass));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<LiveClass>>> getAllLiveClasses() {
        return ResponseEntity.ok(ApiResponse.success(liveClassService.getAllLiveClasses()));
    }
}