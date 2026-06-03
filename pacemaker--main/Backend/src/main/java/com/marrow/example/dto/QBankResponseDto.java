package com.marrow.example.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QBankResponseDto {
    private List<QuestionResponseDto> content;
    private Integer page;
    private Integer size;
    private Long totalElements;
    private Integer totalPages;
}
