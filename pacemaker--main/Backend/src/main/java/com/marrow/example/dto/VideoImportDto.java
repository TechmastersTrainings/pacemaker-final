package com.marrow.example.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VideoImportDto {
    private Integer recordNumber;
    private String title;
    private String description;
    private String videoUrl;
    private Integer duration;
    private String category;
}
