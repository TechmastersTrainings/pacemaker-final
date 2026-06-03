package com.marrow.example.service;

import com.marrow.example.dto.VideoAccessResponseDto;
import com.marrow.example.entity.User;
import com.marrow.example.entity.UserSubscription;
import com.marrow.example.entity.Video;
import com.marrow.example.enums.AccessLevel;
import com.marrow.example.enums.SubscriptionStatus;
import com.marrow.example.exception.ResourceNotFoundException;
import com.marrow.example.repository.UserRepository;
import com.marrow.example.repository.UserSubscriptionRepository;
import com.marrow.example.repository.VideoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class VideoService {

    private final VideoRepository videoRepository;
    private final UserRepository userRepository;
    private final UserSubscriptionRepository userSubscriptionRepository;

    public VideoAccessResponseDto checkVideoAccess(Long videoId) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Video video = videoRepository.findById(videoId)
                .orElseThrow(() -> new ResourceNotFoundException("Video not found"));

        UserSubscription subscription = userSubscriptionRepository.findTopByUserIdOrderByCreatedAtDesc(user.getId())
                .orElse(null);

        boolean allowed = false;
        String planName = "NONE";

        if (video.getAccessLevel() == AccessLevel.FREE) {
            allowed = true;
        } else if (subscription != null && subscription.getSubscriptionStatus() == SubscriptionStatus.ACTIVE) {
            planName = subscription.getSubscriptionPlan().getPlanType().name();
            switch (subscription.getSubscriptionPlan().getPlanType()) {
                case HIGH:
                    allowed = true; // High has access to everything
                    break;
                case MEDIUM:
                    if (video.getAccessLevel() == AccessLevel.BASIC || video.getAccessLevel() == AccessLevel.MEDIUM) {
                        allowed = true;
                    }
                    break;
                case BASIC:
                    if (video.getAccessLevel() == AccessLevel.BASIC) {
                        allowed = true;
                    }
                    break;
            }
        }

        return VideoAccessResponseDto.builder()
                .videoId(video.getId())
                .allowed(allowed)
                .subscription(planName)
                .build();
    }

    @org.springframework.cache.annotation.Cacheable(value = "videos", key = "'video:list'")
    public java.util.List<com.marrow.example.dto.VideoResponseDto> getAllVideos() {
        return videoRepository.findAll().stream().map(this::mapToDto).collect(java.util.stream.Collectors.toList());
    }

    @org.springframework.cache.annotation.Cacheable(value = "videos", key = "'video:details:' + #id")
    public com.marrow.example.dto.VideoResponseDto getVideoById(Long id) {
        Video video = videoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Video not found with id: " + id));
        return mapToDto(video);
    }

    @org.springframework.cache.annotation.CacheEvict(value = "videos", allEntries = true)
    public com.marrow.example.dto.VideoResponseDto uploadVideo(
            String title,
            String description,
            String category,
            String accessLevel,
            org.springframework.web.multipart.MultipartFile file) throws java.io.IOException {
        
        java.nio.file.Path uploadPath = java.nio.file.Paths.get("uploads");
        java.nio.file.Files.createDirectories(uploadPath);

        String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename().replaceAll("\\s+", "_");
        java.nio.file.Path filePath = uploadPath.resolve(fileName);
        java.nio.file.Files.copy(file.getInputStream(), filePath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);

        Video video = Video.builder()
                .title(title)
                .description(description)
                .videoUrl("/api/v1/videos/stream/" + fileName)
                .thumbnailUrl("https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=300")
                .duration(300)
                .accessLevel(com.marrow.example.enums.AccessLevel.valueOf(accessLevel.toUpperCase()))
                .category(com.marrow.example.enums.VideoCategory.valueOf(category.toUpperCase()))
                .tags("")
                .createdAt(java.time.LocalDateTime.now())
                .build();

        Video saved = videoRepository.save(video);
        return mapToDto(saved);
    }

    @org.springframework.cache.annotation.CacheEvict(value = "videos", allEntries = true)
    public void deleteVideo(Long id) {
        Video video = videoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Video not found with id: " + id));
        
        // Optionally delete file from disk
        try {
            String url = video.getVideoUrl();
            if (url != null && url.contains("/stream/")) {
                String fileName = url.substring(url.lastIndexOf("/") + 1);
                java.nio.file.Path filePath = java.nio.file.Paths.get("uploads").resolve(fileName);
                java.nio.file.Files.deleteIfExists(filePath);
            }
        } catch (Exception e) {
            // Log but don't fail transaction
        }

        videoRepository.delete(video);
    }

    private com.marrow.example.dto.VideoResponseDto mapToDto(Video video) {
        return com.marrow.example.dto.VideoResponseDto.builder()
                .id(video.getId())
                .title(video.getTitle())
                .description(video.getDescription())
                .videoUrl(video.getVideoUrl())
                .thumbnailUrl(video.getThumbnailUrl())
                .duration(video.getDuration())
                .accessLevel(video.getAccessLevel() != null ? video.getAccessLevel().name() : "FREE")
                .category(video.getCategory() != null ? video.getCategory().name() : "GENERAL")
                .build();
    }
}