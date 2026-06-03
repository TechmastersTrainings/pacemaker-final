package com.marrow.example.util;

import com.marrow.example.entity.Recording;
import com.marrow.example.enums.RecordingStatus;

import java.time.LocalDateTime;
import java.util.UUID;

public class RecordingUtil {
    public static Recording createMockRecording(String title, int duration) {
        return Recording.builder()
                .recordingId("REC_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .title(title)
                .recordingUrl("https://s3.amazonaws.com/marrow-live-recordings/" + UUID.randomUUID() + ".mp4")
                .duration(duration)
                .recordingStatus(RecordingStatus.COMPLETED)
                .createdAt(LocalDateTime.now())
                .build();
    }
}
