package com.marrow.example.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter

public class SubscriptionRequest {

    private Long userId;

    private String planName;
}