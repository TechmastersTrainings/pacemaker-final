package com.marrow.example.service;

import org.springframework.stereotype.Service;

import com.marrow.example.entity.PaymentWebhook;
import com.marrow.example.repository.PaymentWebhookRepository;

@Service
public class PaymentWebhookService {

    private final PaymentWebhookRepository
            paymentWebhookRepository;

    public PaymentWebhookService(

            PaymentWebhookRepository
                    paymentWebhookRepository) {

        this.paymentWebhookRepository =
                paymentWebhookRepository;
    }

    public PaymentWebhook saveWebhook(

            PaymentWebhook webhook) {

        return paymentWebhookRepository
                .save(webhook);
    }
}