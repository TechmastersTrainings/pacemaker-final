package com.marrow.example.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter

public class PaymentWebhookRequest {

    private String paymentId;

    private Long userId;

    private String eventType;

    private String paymentStatus;

    private Double amount;
}