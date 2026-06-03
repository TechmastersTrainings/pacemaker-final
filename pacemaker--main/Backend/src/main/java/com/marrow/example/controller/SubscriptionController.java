package com.marrow.example.controller;

import com.marrow.example.dto.CreateSubscriptionRequestDto;
import com.marrow.example.dto.CreateSubscriptionResponseDto;
import com.marrow.example.dto.VerifyPaymentRequestDto;
import com.marrow.example.service.SubscriptionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/subscriptions")
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    @PostMapping("/create")
    public ResponseEntity<CreateSubscriptionResponseDto> createSubscription(@Valid @RequestBody CreateSubscriptionRequestDto requestDto) {
        return ResponseEntity.ok(subscriptionService.createSubscription(requestDto));
    }

    @PostMapping("/verify")
    public ResponseEntity<Map<String, String>> verifyPayment(@Valid @RequestBody VerifyPaymentRequestDto requestDto) {
        subscriptionService.verifyPayment(requestDto);
        return ResponseEntity.ok(Map.of("message", "Payment Verified Successfully"));
    }
}