package com.marrow.example.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "live_recordings")

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder

public class LiveRecording {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long liveClassId;

    @Column(length = 1000)
    private String zoomRecordingUrl;

    private String muxAssetId;

    @Column(length = 1000)
    private String muxPlaybackUrl;

    private LocalDateTime uploadedAt;

    @PrePersist
    public void prePersist() {

        uploadedAt = LocalDateTime.now();
    }
}