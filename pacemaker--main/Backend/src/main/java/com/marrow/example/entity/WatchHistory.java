package com.marrow.example.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;

import lombok.*;

@Entity
@Table(name = "watch_history")

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder

public class WatchHistory {

    @Id
    @GeneratedValue(strategy =
            GenerationType.IDENTITY)

    private Long id;

    private Long userId;

    private Long videoId;

    private Integer watchDuration;

    private Boolean completed;

    private LocalDateTime watchedAt;

    @PrePersist
    public void prePersist() {

        watchedAt = LocalDateTime.now();

        if (completed == null) {

            completed = false;
        }
    }
}