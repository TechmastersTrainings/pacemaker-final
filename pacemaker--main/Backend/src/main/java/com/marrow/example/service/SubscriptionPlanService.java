package com.marrow.example.service;

import com.marrow.example.dto.SubscriptionPlanResponseDto;
import com.marrow.example.entity.SubscriptionPlan;
import com.marrow.example.repository.SubscriptionPlanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SubscriptionPlanService {

    private final SubscriptionPlanRepository subscriptionPlanRepository;

    public List<SubscriptionPlanResponseDto> getAllPlans() {
        return subscriptionPlanRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private SubscriptionPlanResponseDto mapToDto(SubscriptionPlan plan) {
        return SubscriptionPlanResponseDto.builder()
                .id(plan.getId())
                .planType(plan.getPlanType())
                .price(plan.getPrice())
                .qbankAccess(plan.getQbankAccess())
                .videoAccess(plan.getVideoAccess())
                .liveClassAccess(plan.getLiveClassAccess())
                .aiAccess(plan.getAiAccess())
                .description(plan.getDescription())
                .build();
    }
}
