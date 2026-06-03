package com.marrow.example.service;

import com.marrow.example.dto.UserSubscriptionResponseDto;
import com.marrow.example.entity.User;
import com.marrow.example.entity.UserSubscription;
import com.marrow.example.exception.ResourceNotFoundException;
import com.marrow.example.repository.UserRepository;
import com.marrow.example.repository.UserSubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class UserSubscriptionService {

    private final UserSubscriptionRepository userSubscriptionRepository;
    private final UserRepository userRepository;

    public UserSubscriptionResponseDto getUserSubscription() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        UserSubscription subscription = userSubscriptionRepository.findTopByUserIdOrderByCreatedAtDesc(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("No active subscription found"));

        return UserSubscriptionResponseDto.builder()
                .plan(subscription.getSubscriptionPlan().getPlanType().name())
                .status(subscription.getSubscriptionStatus().name())
                .expiryDate(subscription.getExpiryDate() != null ? subscription.getExpiryDate().format(DateTimeFormatter.ISO_LOCAL_DATE) : null)
                .build();
    }
}
