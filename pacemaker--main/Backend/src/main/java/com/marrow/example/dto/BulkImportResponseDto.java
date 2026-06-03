package com.marrow.example.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkImportResponseDto {
    private int totalRecords;
    private int successfulRecords;
    private int failedRecords;
    private String status;
    private String fileName;
}
