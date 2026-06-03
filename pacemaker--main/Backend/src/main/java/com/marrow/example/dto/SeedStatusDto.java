package com.marrow.example.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SeedStatusDto {
    private boolean completed;
    private long recordsCreated;
    private long students;
    private long trainers;
    private long questions;
    private long mockExams;
}
