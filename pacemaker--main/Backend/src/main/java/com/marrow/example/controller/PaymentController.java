package com.marrow.example.controller;

import com.marrow.example.dto.CreateOrderRequestDto;
import com.marrow.example.dto.CreateOrderResponseDto;
import com.marrow.example.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/create-order")
    public ResponseEntity<CreateOrderResponseDto> createOrder(@Valid @RequestBody CreateOrderRequestDto requestDto) {
        return ResponseEntity.ok(paymentService.createOrder(requestDto));
    }
}
