package com.marrow.example.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter

public class LiveRecordingRequest {

    private Long liveClassId;

    private String zoomRecordingUrl;
}