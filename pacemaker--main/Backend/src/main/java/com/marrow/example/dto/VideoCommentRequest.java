package com.marrow.example.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter

public class VideoCommentRequest {

    private Long videoId;

    private Long userId;

    private String commentText;

    private Long parentCommentId;
}