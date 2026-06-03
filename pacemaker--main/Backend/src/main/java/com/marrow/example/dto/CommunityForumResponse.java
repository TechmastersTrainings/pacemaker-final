package com.marrow.example.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder

public class CommunityForumResponse {

    private Long id;

    private String forumName;

    private String discourseUrl;

    private String iframeUrl;

    private Boolean ssoEnabled;

    private String ssoLoginUrl;
}