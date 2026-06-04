package com.marrow.example.controller;

import com.marrow.example.dto.EmailResponseDto;
import com.marrow.example.dto.NotificationHistoryResponseDto;
import com.marrow.example.dto.PaymentConfirmationDto;
import com.marrow.example.dto.WelcomeEmailDto;
import com.marrow.example.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @PostMapping("/welcome")
    public ResponseEntity<EmailResponseDto> sendWelcomeEmail(@Valid @RequestBody WelcomeEmailDto requestDto) {
        return ResponseEntity.ok(notificationService.sendWelcomeEmail(requestDto));
    }

    @PostMapping("/payment-confirmation")
    public ResponseEntity<EmailResponseDto> sendPaymentConfirmation(@Valid @RequestBody PaymentConfirmationDto requestDto) {
        return ResponseEntity.ok(notificationService.sendPaymentConfirmation(requestDto));
    }

    @GetMapping("/history")
    public ResponseEntity<List<NotificationHistoryResponseDto>> getNotificationHistory() {
        return ResponseEntity.ok(notificationService.getNotificationHistory());
    }
}
