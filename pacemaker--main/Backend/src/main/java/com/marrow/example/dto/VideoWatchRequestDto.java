package com.marrow.example.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class VideoWatchRequestDto {
    @NotNull
    private Long videoId;
    
    @NotNull
    private Integer watchedDuration;
}
