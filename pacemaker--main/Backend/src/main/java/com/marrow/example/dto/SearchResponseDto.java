package com.marrow.example.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchResponseDto {
    private List<VideoSearchDto> videos;
    private List<MCQSearchDto> mcqs;
    private List<LiveClassSearchDto> liveClasses;
}
