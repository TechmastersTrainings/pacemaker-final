package com.marrow.example.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VideoHistoryResponseDto {
    private String videoTitle;
    private Integer progressPercentage;
    private LocalDateTime lastWatchedTime;
}
