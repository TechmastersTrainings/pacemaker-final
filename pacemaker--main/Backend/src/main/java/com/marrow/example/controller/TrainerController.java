package com.marrow.example.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/trainer")
@RequiredArgsConstructor
public class TrainerController {

    @PreAuthorize("hasRole('TRAINER') or hasRole('ADMIN')")
    @PostMapping("/video")
    public ResponseEntity<Map<String, String>> uploadVideo() {
        return ResponseEntity.ok(Map.of("message", "Video uploaded successfully by trainer"));
    }

    @PreAuthorize("hasRole('TRAINER') or hasRole('ADMIN')")
    @PostMapping("/live-class")
    public ResponseEntity<Map<String, String>> createLiveClass() {
        return ResponseEntity.ok(Map.of("message", "Live class created successfully by trainer"));
    }
}
