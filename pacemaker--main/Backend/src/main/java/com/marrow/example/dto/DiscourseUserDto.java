package com.marrow.example.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DiscourseUserDto {
    private Boolean valid;
    private String username;
    private String email;
    private String role;
    private String externalId;
}
