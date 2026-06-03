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
public class LiveClassSearchDto {
    private Long id;
    private String title;
    private String trainer;
    private String topic;
    private LocalDateTime scheduledTime;
}
