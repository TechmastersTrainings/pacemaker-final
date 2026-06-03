package com.marrow.example.controller;

import com.marrow.example.dto.RecordingResponseDto;
import com.marrow.example.dto.SchedulerStatusDto;
import com.marrow.example.service.RecordingService;
import com.marrow.example.service.SchedulerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/recordings")
@RequiredArgsConstructor
public class RecordingController {

    private final RecordingService recordingService;
    private final SchedulerService schedulerService;

    @PostMapping("/fetch")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> fetchRecordingsManually() {
        recordingService.fetchRecordingsAsync();
        return ResponseEntity.ok(Map.of("message", "Recording fetch started successfully"));
    }

    @GetMapping("/status/{recordingId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('TRAINER')")
    public ResponseEntity<RecordingResponseDto> getRecordingStatus(@PathVariable String recordingId) {
        return ResponseEntity.ok(recordingService.getRecordingStatus(recordingId));
    }

    @GetMapping("/history")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<SchedulerStatusDto>> getSchedulerHistory() {
        return ResponseEntity.ok(schedulerService.getSchedulerHistory());
    }
}
