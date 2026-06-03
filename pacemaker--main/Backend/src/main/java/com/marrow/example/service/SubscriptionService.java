package com.marrow.example.service;

import com.marrow.example.dto.CreateSubscriptionRequestDto;
import com.marrow.example.dto.CreateSubscriptionResponseDto;
import com.marrow.example.dto.VerifyPaymentRequestDto;
import com.marrow.example.entity.PaymentHistory;
import com.marrow.example.entity.SubscriptionPlan;
import com.marrow.example.entity.User;
import com.marrow.example.entity.UserSubscription;
import com.marrow.example.enums.PaymentStatus;
import com.marrow.example.enums.SubscriptionStatus;
import com.marrow.example.exception.InvalidSignatureException;
import com.marrow.example.exception.ResourceNotFoundException;
import com.marrow.example.repository.PaymentHistoryRepository;
import com.marrow.example.repository.SubscriptionPlanRepository;
import com.marrow.example.repository.UserRepository;
import com.marrow.example.repository.UserSubscriptionRepository;
import com.marrow.example.util.AppConstants;
import com.marrow.example.util.RazorpaySignatureUtil;
import com.razorpay.RazorpayClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubscriptionService {

    private final RazorpayClient razorpayClient;
    private final UserSubscriptionRepository userSubscriptionRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final PaymentHistoryRepository paymentHistoryRepository;
    private final UserRepository userRepository;
    private final RazorpaySignatureUtil signatureUtil;

    @Transactional
    public CreateSubscriptionResponseDto createSubscription(CreateSubscriptionRequestDto requestDto) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        SubscriptionPlan plan = subscriptionPlanRepository.findById(requestDto.getSubscriptionPlanId())
                .orElseThrow(() -> new ResourceNotFoundException("Subscription Plan not found"));

        try {
            JSONObject subscriptionRequest = new JSONObject();
            subscriptionRequest.put("plan_id", "plan_dummy_" + plan.getId()); 
            subscriptionRequest.put("total_count", 1);
            subscriptionRequest.put("customer_notify", 1);
            
            String subscriptionId = "sub_razorpay_" + System.currentTimeMillis();

            UserSubscription userSubscription = UserSubscription.builder()
                    .user(user)
                    .subscriptionPlan(plan)
                    .subscriptionId(subscriptionId)
                    .subscriptionStatus(SubscriptionStatus.PENDING)
                    .paymentStatus(PaymentStatus.PENDING)
                    .build();

            userSubscriptionRepository.save(userSubscription);

            return CreateSubscriptionResponseDto.builder()
                    .subscriptionId(subscriptionId)
                    .status("created")
                    .build();

        } catch (Exception e) {
            log.error("Error creating subscription", e);
            throw new RuntimeException("Could not create subscription", e);
        }
    }

    @Transactional
    public void verifyPayment(VerifyPaymentRequestDto requestDto) {
        boolean isValid = signatureUtil.verifySignature(
                requestDto.getRazorpaySubscriptionId(), // Using subscription ID as order ID for signature
                requestDto.getRazorpayPaymentId(),
                requestDto.getRazorpaySignature()
        );

        if (!isValid) {
            throw new InvalidSignatureException("Invalid Razorpay Signature");
        }

        UserSubscription userSubscription = userSubscriptionRepository.findBySubscriptionId(requestDto.getRazorpaySubscriptionId())
                .orElseThrow(() -> new ResourceNotFoundException("Subscription not found"));

        userSubscription.setSubscriptionStatus(SubscriptionStatus.ACTIVE);
        userSubscription.setPaymentStatus(PaymentStatus.SUCCESS);
        userSubscription.setStartDate(LocalDate.now());
        userSubscription.setExpiryDate(LocalDate.now().plusYears(1));

        userSubscriptionRepository.save(userSubscription);

        PaymentHistory paymentHistory = PaymentHistory.builder()
                .user(userSubscription.getUser())
                .razorpayPaymentId(requestDto.getRazorpayPaymentId())
                .subscriptionId(userSubscription.getSubscriptionId())
                .amount(userSubscription.getSubscriptionPlan().getPrice())
                .currency(AppConstants.CURRENCY_INR)
                .paymentStatus(PaymentStatus.SUCCESS)
                .build();

        paymentHistoryRepository.save(paymentHistory);
    }
}