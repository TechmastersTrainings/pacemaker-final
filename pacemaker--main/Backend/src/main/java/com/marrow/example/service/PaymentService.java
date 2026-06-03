package com.marrow.example.service;

import com.marrow.example.dto.CreateOrderRequestDto;
import com.marrow.example.dto.CreateOrderResponseDto;
import com.marrow.example.dto.RazorpayWebhookDto;
import com.marrow.example.entity.PaymentOrder;
import com.marrow.example.entity.SubscriptionPlan;
import com.marrow.example.exception.InvalidWebhookException;
import com.marrow.example.exception.ResourceNotFoundException;
import com.marrow.example.repository.PaymentOrderRepository;
import com.marrow.example.repository.SubscriptionPlanRepository;
import com.marrow.example.util.AppConstants;
import com.marrow.example.util.RazorpaySignatureUtil;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final RazorpayClient razorpayClient;
    private final PaymentOrderRepository paymentOrderRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final RazorpaySignatureUtil signatureUtil;

    @Value("${razorpay.key.id}")
    private String keyId;

    @Transactional
    public CreateOrderResponseDto createOrder(CreateOrderRequestDto requestDto) {
        SubscriptionPlan plan = subscriptionPlanRepository.findById(requestDto.getSubscriptionPlanId())
                .orElseThrow(() -> new ResourceNotFoundException("Subscription Plan not found"));

        try {
            JSONObject orderRequest = new JSONObject();
            // amount in paise
            orderRequest.put("amount", requestDto.getAmount() * 100);
            orderRequest.put("currency", AppConstants.CURRENCY_INR);
            orderRequest.put("receipt", "txn_" + System.currentTimeMillis());
            
            Order razorpayOrder = razorpayClient.orders.create(orderRequest);
            
            String orderId = razorpayOrder.get("id");
            
            PaymentOrder paymentOrder = PaymentOrder.builder()
                    .razorpayOrderId(orderId)
                    .amount(requestDto.getAmount())
                    .currency(AppConstants.CURRENCY_INR)
                    .paymentStatus(AppConstants.PAYMENT_STATUS_CREATED)
                    .receipt(orderRequest.getString("receipt"))
                    .plan(plan)
                    .build();
                    
            paymentOrderRepository.save(paymentOrder);

            return CreateOrderResponseDto.builder()
                    .orderId(orderId)
                    .currency(AppConstants.CURRENCY_INR)
                    .amount(requestDto.getAmount())
                    .key(keyId)
                    .build();

        } catch (Exception e) {
            log.error("Error creating razorpay order", e);
            throw new RuntimeException("Could not create razorpay order", e);
        }
    }

    @Transactional
    public void processWebhook(RazorpayWebhookDto webhookDto) {
        boolean isValid = signatureUtil.verifySignature(
                webhookDto.getRazorpayOrderId(),
                webhookDto.getRazorpayPaymentId(),
                webhookDto.getRazorpaySignature()
        );

        if (!isValid) {
            throw new InvalidWebhookException("Invalid Razorpay Signature");
        }

        PaymentOrder paymentOrder = paymentOrderRepository.findByRazorpayOrderId(webhookDto.getRazorpayOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Payment Order not found"));

        paymentOrder.setRazorpayPaymentId(webhookDto.getRazorpayPaymentId());
        paymentOrder.setRazorpaySignature(webhookDto.getRazorpaySignature());
        paymentOrder.setPaymentStatus(AppConstants.PAYMENT_STATUS_SUCCESS);
        
        paymentOrderRepository.save(paymentOrder);
        
        // Additional business logic for assigning plan to user would go here
    }
}
