package com.marrow.example.controller;

import com.marrow.example.dto.SeedResponseDto;
import com.marrow.example.dto.SeedStatusDto;
import com.marrow.example.service.DataSeederService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.env.Environment;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;

@RestController
@RequestMapping("/api/admin/seed")
@RequiredArgsConstructor
@Tag(name = "Data Seeding", description = "Admin API for triggering data seeding")
public class SeedController {

    private final DataSeederService dataSeederService;
    private final Environment environment;

    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    @Operation(summary = "Run Data Seeding", description = "Manually triggers data seeding. Only allowed in dev/demo profile.")
    public ResponseEntity<?> runSeedData() {
        if (!isDevelopmentOrDemoProfile()) {
            return ResponseEntity.badRequest().body("Seeding is only allowed in dev or demo profiles");
        }
        SeedResponseDto response = dataSeederService.runSeedData();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/status")
    @PreAuthorize("hasAuthority('ADMIN')")
    @Operation(summary = "Get Seed Status", description = "Checks the current database seed status.")
    public ResponseEntity<SeedStatusDto> getSeedStatus() {
        return ResponseEntity.ok(dataSeederService.getSeedStatus());
    }

    private boolean isDevelopmentOrDemoProfile() {
        String[] activeProfiles = environment.getActiveProfiles();
        if (activeProfiles == null || activeProfiles.length == 0) {
            return false;
        }
        return Arrays.stream(activeProfiles)
                .anyMatch(profile -> profile.equals("dev") || profile.equals("demo"));
    }
}
