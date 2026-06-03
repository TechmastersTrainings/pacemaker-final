package com.marrow.example.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "community_forums")

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder

public class CommunityForum {

    @Id
    @GeneratedValue(strategy =
            GenerationType.IDENTITY)

    private Long id;

    private String forumName;

    @Column(length = 1000)
    private String discourseUrl;

    @Column(length = 2000)
    private String iframeUrl;

    private Boolean ssoEnabled;

    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {

        createdAt = LocalDateTime.now();

        if (ssoEnabled == null) {

            ssoEnabled = true;
        }
    }
}