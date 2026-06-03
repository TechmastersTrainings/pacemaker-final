package com.marrow.example.controller;

import com.marrow.example.dto.BulkImportResponseDto;
import com.marrow.example.dto.ValidationErrorDto;
import com.marrow.example.service.BulkImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/import")
@RequiredArgsConstructor
public class BulkImportController {

    private final BulkImportService bulkImportService;

    @PostMapping("/mcq")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BulkImportResponseDto> uploadMCQFile(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(bulkImportService.importMCQs(file));
    }

    @PostMapping("/video")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BulkImportResponseDto> uploadVideoFile(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(bulkImportService.importVideos(file));
    }

    @PostMapping("/live-class")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BulkImportResponseDto> uploadLiveClassFile(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(bulkImportService.importLiveClasses(file));
    }

    @GetMapping("/history")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<BulkImportResponseDto>> getImportHistory() {
        return ResponseEntity.ok(bulkImportService.getImportHistory());
    }

    @GetMapping("/errors/{importId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ValidationErrorDto>> getValidationErrors(@PathVariable Long importId) {
        return ResponseEntity.ok(bulkImportService.getValidationErrors(importId));
    }
}
