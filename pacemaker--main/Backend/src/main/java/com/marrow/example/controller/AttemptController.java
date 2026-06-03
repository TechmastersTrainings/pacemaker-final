package com.marrow.example.controller;

import org.springframework.web.bind.annotation.*;

import com.marrow.example.dto.AttemptRequest;
import com.marrow.example.entity.Attempt;
import com.marrow.example.service.AttemptService;

@RestController
@RequestMapping("/api/v1/attempts")

public class AttemptController {

    private final AttemptService
            attemptService;

    public AttemptController(
            AttemptService attemptService) {

        this.attemptService =
                attemptService;
    }

    @PostMapping

    public Attempt submitAttempt(
            @RequestBody
            AttemptRequest request) {

        return attemptService
                .submitAttempt(request);
    }
}