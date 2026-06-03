package com.marrow.example.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.marrow.example.entity.PaymentWebhook;

public interface PaymentWebhookRepository
        extends JpaRepository<PaymentWebhook, Long> {

}