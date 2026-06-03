package com.marrow.example.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;

import lombok.*;

@Entity
@Table(name = "user_notes")

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder

public class UserNote {

    @Id
    @GeneratedValue(strategy =
            GenerationType.IDENTITY)

    private Long id;

    private Long userId;

    private Long videoId;

    @Column(length = 5000)
    private String note;

    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {

        createdAt = LocalDateTime.now();
    }
}