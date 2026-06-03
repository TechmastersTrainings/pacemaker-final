package com.marrow.example.controller;

import com.marrow.example.dto.VideoHistoryResponseDto;
import com.marrow.example.dto.VideoWatchRequestDto;
import com.marrow.example.dto.VideoWatchResponseDto;
import com.marrow.example.service.VideoWatchHistoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/videos")
@RequiredArgsConstructor
public class VideoHistoryController {

    private final VideoWatchHistoryService watchHistoryService;

    @PostMapping("/watch")
    public ResponseEntity<VideoWatchResponseDto> watchVideo(@Valid @RequestBody VideoWatchRequestDto requestDto) {
        return ResponseEntity.ok(watchHistoryService.watchVideo(requestDto));
    }

    @GetMapping("/history")
    public ResponseEntity<List<VideoHistoryResponseDto>> getWatchHistory() {
        return ResponseEntity.ok(watchHistoryService.getWatchHistory());
    }
}
