package com.marrow.example.controller;

import com.marrow.example.dto.SubscriptionPlanResponseDto;
import com.marrow.example.service.SubscriptionPlanService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/subscription-plans")
@RequiredArgsConstructor
public class SubscriptionPlanController {

    private final SubscriptionPlanService subscriptionPlanService;

    @GetMapping
    public ResponseEntity<List<SubscriptionPlanResponseDto>> getAllPlans() {
        return ResponseEntity.ok(subscriptionPlanService.getAllPlans());
    }
}
