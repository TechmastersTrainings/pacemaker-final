package com.marrow.example.controller;

import com.marrow.example.dto.ApiResponse;
import com.marrow.example.dto.VideoAccessResponseDto;
import com.marrow.example.dto.VideoResponseDto;
import com.marrow.example.service.VideoService;
import com.marrow.example.service.VideoWatchHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/videos")
@RequiredArgsConstructor
public class VideoController {

    private final VideoService videoService;
    private final VideoWatchHistoryService videoWatchHistoryService;

    @GetMapping("/{videoId}/access")
    public ResponseEntity<ApiResponse<VideoAccessResponseDto>> checkVideoAccess(@PathVariable Long videoId) {
        return ResponseEntity.ok(ApiResponse.success(videoService.checkVideoAccess(videoId)));
    }

    @GetMapping("/{videoId}/resume")
    public ResponseEntity<ApiResponse<Map<String, Object>>> resumeVideo(@PathVariable Long videoId) {
        return ResponseEntity.ok(ApiResponse.success(videoWatchHistoryService.resumeVideo(videoId)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<VideoResponseDto>>> getAllVideos() {
        return ResponseEntity.ok(ApiResponse.success(videoService.getAllVideos()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<VideoResponseDto>> getVideoById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(videoService.getVideoById(id)));
    }

    @PostMapping(value = "/upload", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN') or hasRole('TRAINER')")
    public ResponseEntity<ApiResponse<VideoResponseDto>> uploadVideo(
            @RequestParam("title") String title,
            @RequestParam("description") String description,
            @RequestParam("category") String category,
            @RequestParam("accessLevel") String accessLevel,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) throws java.io.IOException {
        
        VideoResponseDto response = videoService.uploadVideo(title, description, category, accessLevel, file);
        return ResponseEntity.ok(ApiResponse.success("Video uploaded successfully", response));
    }

    @GetMapping("/stream/{fileName}")
    public ResponseEntity<org.springframework.core.io.Resource> streamVideo(@PathVariable String fileName) throws java.io.IOException {
        java.nio.file.Path path = java.nio.file.Paths.get("uploads").resolve(fileName);
        org.springframework.core.io.Resource resource = new org.springframework.core.io.UrlResource(path.toUri());
        
        return ResponseEntity.ok()
                .contentType(org.springframework.http.MediaType.parseMediaType("video/mp4"))
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"")
                .body(resource);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('TRAINER')")
    public ResponseEntity<ApiResponse<String>> deleteVideo(@PathVariable Long id) {
        videoService.deleteVideo(id);
        return ResponseEntity.ok(ApiResponse.success("Video deleted successfully", "Success"));
    }
}