package com.marrow.example.entity;

import jakarta.persistence.*;

import lombok.*;

@Entity
@Table(name = "video_likes")

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder

public class VideoLike {

    @Id
    @GeneratedValue(strategy =
            GenerationType.IDENTITY)

    private Long id;

    private Long userId;

    private Long videoId;
}