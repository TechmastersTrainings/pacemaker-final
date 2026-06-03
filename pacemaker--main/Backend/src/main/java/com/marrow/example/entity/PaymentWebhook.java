package com.marrow.example.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "payment_webhooks")

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder

public class PaymentWebhook {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String paymentId;

    private Long userId;

    private String eventType;

    private String paymentStatus;

    private Double amount;

    private LocalDateTime receivedAt;

    @PrePersist
    public void prePersist() {

        receivedAt = LocalDateTime.now();
    }
}