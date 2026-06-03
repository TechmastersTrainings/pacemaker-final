package com.marrow.example.dto;

import com.marrow.example.enums.SubscriptionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionPlanResponseDto {
    private Long id;
    private SubscriptionType planType;
    private Double price;
    private Boolean qbankAccess;
    private Boolean videoAccess;
    private Boolean liveClassAccess;
    private Boolean aiAccess;
    private String description;
}
