package com.marrow.example.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder

public class LiveRecordingResponse {

    private Long id;

    private Long liveClassId;

    private String zoomRecordingUrl;

    private String muxAssetId;

    private String muxPlaybackUrl;
}