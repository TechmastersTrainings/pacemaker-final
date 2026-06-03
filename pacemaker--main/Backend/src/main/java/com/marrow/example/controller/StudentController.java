package com.marrow.example.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/student")
@RequiredArgsConstructor
public class StudentController {

    @PreAuthorize("hasRole('STUDENT') or hasRole('ADMIN')")
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getStudentDashboard() {
        return ResponseEntity.ok(Map.of("status", "ACTIVE", "videosWatched", 15, "mcqsAttempted", 120));
    }

    @PreAuthorize("hasRole('STUDENT') or hasRole('ADMIN')")
    @GetMapping("/subscription")
    public ResponseEntity<Map<String, String>> getStudentSubscription() {
        return ResponseEntity.ok(Map.of("plan", "PRO_PLUS", "validity", "1 Year"));
    }
}
