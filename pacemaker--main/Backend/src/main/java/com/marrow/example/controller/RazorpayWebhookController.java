package com.marrow.example.controller;

import com.marrow.example.dto.RazorpayWebhookDto;
import com.marrow.example.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/webhooks")
@RequiredArgsConstructor
public class RazorpayWebhookController {

    private final PaymentService paymentService;

    @PostMapping("/razorpay")
    public ResponseEntity<String> handleRazorpayWebhook(@Valid @RequestBody RazorpayWebhookDto webhookDto) {
        paymentService.processWebhook(webhookDto);
        return ResponseEntity.ok("Webhook processed successfully");
    }
}
