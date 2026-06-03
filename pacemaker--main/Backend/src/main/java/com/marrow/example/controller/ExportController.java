package com.marrow.example.controller;

import com.marrow.example.dto.ExportHistoryDto;
import com.marrow.example.enums.DifficultyLevel;
import com.marrow.example.service.ExportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/export")
@RequiredArgsConstructor
@Tag(name = "Export", description = "Admin APIs for Data Export")
public class ExportController {

    private final ExportService exportService;

    @GetMapping("/users")
    @PreAuthorize("hasAuthority('ADMIN')")
    @Operation(summary = "Export Users CSV")
    public void exportUsers(
            @RequestParam(required = false) String role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size,
            HttpServletResponse response) {
        exportService.exportUsers(role, page, size, response);
    }

    @GetMapping("/questions")
    @PreAuthorize("hasAuthority('ADMIN')")
    @Operation(summary = "Export Questions CSV")
    public void exportQuestions(
            @RequestParam(required = false) DifficultyLevel difficulty,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size,
            HttpServletResponse response) {
        exportService.exportQuestions(difficulty, page, size, response);
    }

    @GetMapping("/history")
    @PreAuthorize("hasAuthority('ADMIN')")
    @Operation(summary = "Get Export History")
    public ResponseEntity<List<ExportHistoryDto>> getExportHistory() {
        return ResponseEntity.ok(exportService.getExportHistory());
    }
}
