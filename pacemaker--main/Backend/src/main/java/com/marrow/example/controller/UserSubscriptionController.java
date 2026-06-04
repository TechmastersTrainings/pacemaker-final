package com.marrow.example.controller;

import com.marrow.example.dto.UserSubscriptionResponseDto;
import com.marrow.example.service.UserSubscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/user/subscription")
@RequiredArgsConstructor
public class UserSubscriptionController {

    private final UserSubscriptionService userSubscriptionService;

    @GetMapping
    public ResponseEntity<UserSubscriptionResponseDto> getUserSubscription() {
        return ResponseEntity.ok(userSubscriptionService.getUserSubscription());
    }
}
