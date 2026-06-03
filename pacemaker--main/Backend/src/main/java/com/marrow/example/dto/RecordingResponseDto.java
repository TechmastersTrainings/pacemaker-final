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
public class RecordingResponseDto {
    private String recordingId;
    private String status;
    private String title;
    private String recordingUrl;
    private LocalDateTime createdAt;
}
