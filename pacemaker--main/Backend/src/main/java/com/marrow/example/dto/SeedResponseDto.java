package com.marrow.example.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SeedResponseDto {
    private int studentsCreated;
    private int trainersCreated;
    private int questionsCreated;
    private int mockExamsCreated;
}
