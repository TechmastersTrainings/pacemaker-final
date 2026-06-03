package com.marrow.example.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "attempts")

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder

public class Attempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long userId;

    private Long studentId;

    private Long examId;
    

    @Column(length = 5000)
    private String studentAnswers;

    private Integer score;

    private LocalDateTime attemptedAt;
    private LocalDateTime submittedAt;
    

    @PrePersist
    public void prePersist() {

        attemptedAt = LocalDateTime.now();
    }
}