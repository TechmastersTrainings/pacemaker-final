package com.marrow.example.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import com.marrow.example.dto.ApiResponse;
import com.marrow.example.dto.AuthResponse;
import com.marrow.example.dto.LoginRequest;
import com.marrow.example.dto.RegisterRequest;
import com.marrow.example.service.AuthService;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<String>> register(
            @Validated @RequestBody RegisterRequest request) {

        String message = authService.register(request);
        return ResponseEntity.ok(ApiResponse.success(message));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Validated @RequestBody LoginRequest request) {

        AuthResponse authResponse = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", authResponse));
    }
}