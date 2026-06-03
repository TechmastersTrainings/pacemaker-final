package com.marrow.example.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MCQSearchDto {
    private Long id;
    private String question;
    private String subject;
    private String topic;
    private String tags;
}
