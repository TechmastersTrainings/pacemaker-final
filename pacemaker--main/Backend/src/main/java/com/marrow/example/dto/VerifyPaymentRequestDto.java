package com.marrow.example.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class VerifyPaymentRequestDto {
    @NotBlank
    private String razorpayPaymentId;

    @NotBlank
    private String razorpaySubscriptionId;

    @NotBlank
    private String razorpaySignature;
}
