package com.marrow.example.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateSubscriptionRequestDto {
    @NotNull(message = "Subscription Plan ID is required")
    private Long subscriptionPlanId;
}
