package com.marrow.example.service;

import com.marrow.example.dto.SubscriptionStatusDto;
import com.marrow.example.dto.UserSubscriptionDto;
import com.marrow.example.entity.UserSubscription;
import com.marrow.example.enums.SubscriptionStatus;
import com.marrow.example.exception.ResourceNotFoundException;
import com.marrow.example.repository.UserSubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubscriptionManagementService {

    private final UserSubscriptionRepository subscriptionRepository;

    @Cacheable(value = "adminSubscriptions")
    public List<UserSubscriptionDto> getAllSubscriptions() {
        log.info("Fetching all user subscriptions for admin");
        return subscriptionRepository.findAll().stream()
                .map(sub -> UserSubscriptionDto.builder()
                        .id(sub.getId())
                        .userName(sub.getUser() != null ? sub.getUser().getName() : "Unknown")
                        .plan(sub.getSubscriptionPlan() != null && sub.getSubscriptionPlan().getPlanType() != null ? sub.getSubscriptionPlan().getPlanType().name() : "Custom")
                        .status(sub.getSubscriptionStatus().name())
                        .startDate(sub.getStartDate())
                        .expiryDate(sub.getExpiryDate())
                        .active(sub.getActive() != null ? sub.getActive() : (sub.getSubscriptionStatus() == SubscriptionStatus.ACTIVE))
                        .email(sub.getUser() != null ? sub.getUser().getEmail() : "")
                        .amount(sub.getSubscriptionPlan() != null && sub.getSubscriptionPlan().getPrice() != null ? sub.getSubscriptionPlan().getPrice() : 0.0)
                        .paymentMethod(sub.getPaymentStatus() != null ? sub.getPaymentStatus().name() : "UPI")
                        .autoRenew(true)
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    @CacheEvict(value = "adminSubscriptions", allEntries = true)
    public SubscriptionStatusDto disableSubscription(Long subscriptionId) {
        log.info("Disabling subscription ID: {}", subscriptionId);
        UserSubscription sub = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription not found"));

        sub.setSubscriptionStatus(SubscriptionStatus.DISABLED);
        sub.setActive(false);
        subscriptionRepository.save(sub);

        return SubscriptionStatusDto.builder()
                .message("Subscription disabled successfully")
                .build();
    }

    @Transactional
    @CacheEvict(value = "adminSubscriptions", allEntries = true)
    public SubscriptionStatusDto enableSubscription(Long subscriptionId) {
        log.info("Enabling subscription ID: {}", subscriptionId);
        UserSubscription sub = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription not found"));

        sub.setSubscriptionStatus(SubscriptionStatus.ACTIVE);
        sub.setActive(true);
        subscriptionRepository.save(sub);

        return SubscriptionStatusDto.builder()
                .message("Subscription enabled successfully")
                .build();
    }
}
