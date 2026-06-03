package com.marrow.example.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "video_comments")

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder

public class VideoComment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // VIDEO REFERENCE

    private Long videoId;

    // USER REFERENCE

    private Long userId;

    @Column(nullable = false, length = 3000)
    private String commentText;

    // THREADED COMMENT SUPPORT

    private Long parentCommentId;

    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {

        createdAt = LocalDateTime.now();
    }
}