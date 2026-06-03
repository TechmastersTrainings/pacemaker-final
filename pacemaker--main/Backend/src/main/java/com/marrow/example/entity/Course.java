package com.marrow.example.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;

import lombok.*;

@Entity
@Table(name = "courses")

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder

public class Course {

    @Id
    @GeneratedValue(strategy =
            GenerationType.IDENTITY)

    private Long id;

    @Column(nullable = false)
    private String courseName;

    @Column(length = 3000)
    private String description;

    private String thumbnailUrl;

    private Boolean active;

    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {

        createdAt = LocalDateTime.now();

        if (active == null) {

            active = true;
        }
    }
}