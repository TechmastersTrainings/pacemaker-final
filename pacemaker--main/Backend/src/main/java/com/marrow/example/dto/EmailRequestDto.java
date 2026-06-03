package com.marrow.example.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailRequestDto {
    @NotBlank
    @Email
    private String to;
    
    @NotBlank
    private String subject;
    
    @NotBlank
    private String body;
}
