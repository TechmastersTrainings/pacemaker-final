package com.marrow.example.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PaymentConfirmationDto {
    @NotBlank
    @Email
    private String email;
    
    @NotNull
    private Double amount;
    
    @NotBlank
    private String plan;
}
