package com.marrow.example.entity;

import com.marrow.example.enums.RecordingStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "recordings", indexes = {
    @Index(name = "idx_recording_id", columnList = "recording_id"),
    @Index(name = "idx_recording_status", columnList = "recording_status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Recording {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "recording_id", unique = true, nullable = false)
    private String recordingId;

    @Column(nullable = false)
    private String title;

    @Column(name = "recording_url", nullable = false)
    private String recordingUrl;

    @Column(nullable = false)
    private Integer duration;

    @Enumerated(EnumType.STRING)
    @Column(name = "recording_status", nullable = false)
    private RecordingStatus recordingStatus;

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "video_id", referencedColumnName = "id")
    private Video video;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.recordingStatus == null) {
            this.recordingStatus = RecordingStatus.PENDING;
        }
    }
}
