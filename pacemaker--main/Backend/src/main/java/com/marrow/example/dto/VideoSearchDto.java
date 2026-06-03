package com.marrow.example.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VideoSearchDto {
    private Long id;
    private String title;
    private String description;
    private String category;
    private String tags;
    private Integer duration;
    private String thumbnailUrl;
}
