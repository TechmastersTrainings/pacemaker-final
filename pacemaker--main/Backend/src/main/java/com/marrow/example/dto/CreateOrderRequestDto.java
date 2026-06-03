package com.marrow.example.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class CreateOrderRequestDto {
    @NotNull(message = "Subscription Plan ID is required")
    private Long subscriptionPlanId;

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be positive")
    private Double amount;
}
