package com.marrow.example.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BadgeResponseDto {
    private String badgeName;
    private String badgeDescription;
    private String badgeImage;
    private String badgeType;
    private LocalDate earnedDate;
}
