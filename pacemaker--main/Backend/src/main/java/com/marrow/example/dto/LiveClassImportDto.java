package com.marrow.example.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LiveClassImportDto {
    private Integer recordNumber;
    private String title;
    private String trainer;
    private String schedule;
    private String zoomJoinUrl;
    private String topic;
    private String description;
}
