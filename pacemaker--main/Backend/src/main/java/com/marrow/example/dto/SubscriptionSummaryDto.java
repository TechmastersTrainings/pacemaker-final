package com.marrow.example.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionSummaryDto {
    private long totalSubscriptions;
    private long activeSubscriptions;
    private long disabledSubscriptions;
    private long expiredSubscriptions;
}
