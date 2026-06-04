package com.marrow.example.controller;

import com.marrow.example.dto.*;
import com.marrow.example.service.SSOService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/sso")
@RequiredArgsConstructor
@Tag(name = "SSO Integration API", description = "Endpoints for Discourse single sign-on authentication and session management")
public class SSOController {

    private final SSOService ssoService;

    @PostMapping("/discourse/login")
    @Operation(summary = "Generate SSO redirect URL and token for Discourse login")
    public ResponseEntity<SSOResponseDto> generateSsoToken(@RequestBody SSORequestDto ssoRequest, HttpServletRequest request) {
        return ResponseEntity.ok(ssoService.loginDiscourse(ssoRequest, request));
    }

    @PostMapping("/discourse/validate")
    @Operation(summary = "Validate Discourse SSO JWT token")
    public ResponseEntity<DiscourseUserDto> validateSsoToken(@RequestBody SSORequestDto ssoRequest, HttpServletRequest request) {
        return ResponseEntity.ok(ssoService.validateSsoToken(ssoRequest, request));
    }

    @PostMapping("/discourse/logout")
    @Operation(summary = "Logout SSO session across PaceMaker and Discourse")
    public ResponseEntity<LogoutResponseDto> logoutSsoSession(Authentication authentication, HttpServletRequest request) {
        String email = authentication.getName();
        return ResponseEntity.ok(ssoService.logoutSsoSession(email, request));
    }

    @GetMapping("/session")
    @Operation(summary = "Get active SSO session details")
    public ResponseEntity<SessionDetailsDto> getSessionDetails(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(ssoService.getSessionDetails(email));
    }
}
