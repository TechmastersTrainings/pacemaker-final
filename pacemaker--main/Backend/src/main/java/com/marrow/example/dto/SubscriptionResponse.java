package com.marrow.example.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder

public class SubscriptionResponse {

    private Long id;

    private String planName;

    private Double amount;

    private Boolean active;
}