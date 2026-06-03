package com.marrow.example.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "video_watch_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VideoWatchHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "video_id", nullable = false)
    private Video video;

    @Column(name = "watched_duration", nullable = false)
    private Integer watchedDuration;

    @Column(name = "total_duration", nullable = false)
    private Integer totalDuration;

    @Column(name = "progress_percentage", nullable = false)
    private Integer progressPercentage;

    @Column(name = "last_watched_time", nullable = false)
    private LocalDateTime lastWatchedTime;

    @Column(nullable = false)
    private Boolean completed;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.lastWatchedTime = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
        this.lastWatchedTime = LocalDateTime.now();
    }
}
