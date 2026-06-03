package com.marrow.example.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;

import lombok.*;

@Entity
@Table(name = "notifications")

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder

public class Notification {

    @Id
    @GeneratedValue(strategy =
            GenerationType.IDENTITY)

    private Long id;

    private Long userId;

    private String title;

    private String message;

    private Boolean readStatus;

    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {

        createdAt = LocalDateTime.now();

        if (readStatus == null) {

            readStatus = false;
        }
    }
}
		