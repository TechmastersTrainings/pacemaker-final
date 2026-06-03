package com.marrow.example.service;

import com.marrow.example.dto.VideoHistoryResponseDto;
import com.marrow.example.dto.VideoWatchRequestDto;
import com.marrow.example.dto.VideoWatchResponseDto;
import com.marrow.example.entity.User;
import com.marrow.example.entity.Video;
import com.marrow.example.entity.VideoWatchHistory;
import com.marrow.example.exception.ResourceNotFoundException;
import com.marrow.example.exception.VideoAccessDeniedException;
import com.marrow.example.repository.UserRepository;
import com.marrow.example.repository.VideoRepository;
import com.marrow.example.repository.VideoWatchHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VideoWatchHistoryService {

    private final VideoWatchHistoryRepository watchHistoryRepository;
    private final VideoRepository videoRepository;
    private final UserRepository userRepository;
    private final VideoService videoService;

    @Transactional
    public VideoWatchResponseDto watchVideo(VideoWatchRequestDto requestDto) {
        // 1. Check if user actually has access
        if (!videoService.checkVideoAccess(requestDto.getVideoId()).getAllowed()) {
            throw new VideoAccessDeniedException("User does not have access to this video");
        }

        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Video video = videoRepository.findById(requestDto.getVideoId())
                .orElseThrow(() -> new ResourceNotFoundException("Video not found"));

        VideoWatchHistory history = watchHistoryRepository.findByUserIdAndVideoId(user.getId(), video.getId())
                .orElse(VideoWatchHistory.builder()
                        .user(user)
                        .video(video)
                        .totalDuration(video.getDuration())
                        .build());

        history.setWatchedDuration(requestDto.getWatchedDuration());
        
        int progress = (int) (((double) requestDto.getWatchedDuration() / video.getDuration()) * 100);
        history.setProgressPercentage(progress);
        history.setCompleted(progress >= 95);

        watchHistoryRepository.save(history);

        return VideoWatchResponseDto.builder()
                .message("Watch progress saved")
                .build();
    }

    public List<VideoHistoryResponseDto> getWatchHistory() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return watchHistoryRepository.findByUserIdOrderByLastWatchedTimeDesc(user.getId())
                .stream()
                .map(history -> VideoHistoryResponseDto.builder()
                        .videoTitle(history.getVideo().getTitle())
                        .progressPercentage(history.getProgressPercentage())
                        .lastWatchedTime(history.getLastWatchedTime())
                        .build())
                .collect(Collectors.toList());
    }

    public Map<String, Object> resumeVideo(Long videoId) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        VideoWatchHistory history = watchHistoryRepository.findByUserIdAndVideoId(user.getId(), videoId)
                .orElse(null);

        Integer resumeAt = (history != null) ? history.getWatchedDuration() : 0;

        return Map.of(
                "videoId", videoId,
                "resumeAt", resumeAt
        );
    }
}
