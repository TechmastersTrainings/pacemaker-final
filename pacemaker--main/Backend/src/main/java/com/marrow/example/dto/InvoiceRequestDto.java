package com.marrow.example.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class InvoiceRequestDto {
    @NotBlank
    private String paymentId;
}
