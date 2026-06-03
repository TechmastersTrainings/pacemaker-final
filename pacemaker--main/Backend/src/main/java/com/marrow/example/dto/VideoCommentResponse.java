package com.marrow.example.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder

public class VideoCommentResponse {

    private Long id;

    private String comment;

    private Long userId;

    private Long videoId;
}