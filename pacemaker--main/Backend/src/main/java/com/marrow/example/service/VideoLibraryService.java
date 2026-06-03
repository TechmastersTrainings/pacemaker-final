package com.marrow.example.service;

import com.marrow.example.entity.Recording;
import com.marrow.example.entity.Video;
import com.marrow.example.enums.AccessLevel;
import com.marrow.example.enums.VideoCategory;
import com.marrow.example.repository.VideoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class VideoLibraryService {

    private final VideoRepository videoRepository;

    public Video createVideoFromRecording(Recording recording) {
        if (videoRepository.existsByTitleOrVideoUrl(recording.getTitle(), recording.getRecordingUrl())) {
            log.info("Video library entry already exists for recording: {}", recording.getRecordingId());
            return null;
        }

        Video video = Video.builder()
                .title(recording.getTitle())
                .description("Live class recording for " + recording.getTitle())
                .videoUrl(recording.getRecordingUrl())
                .thumbnailUrl("https://s3.amazonaws.com/marrow-live-thumbnails/default.jpg")
                .duration(recording.getDuration())
                .accessLevel(AccessLevel.HIGH)
                .category(VideoCategory.MEDICINE)
                .createdAt(LocalDateTime.now())
                .build();

        return videoRepository.save(video);
    }
}
