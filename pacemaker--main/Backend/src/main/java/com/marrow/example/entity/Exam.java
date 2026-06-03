package com.marrow.example.entity;

import java.time.LocalDateTime;

import java.util.List;

import jakarta.persistence.*;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "exams")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder

public class Exam {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String examTitle;

    @ManyToMany
    @JoinTable(
            name = "exam_questions",

            joinColumns =
            @JoinColumn(name = "exam_id"),

            inverseJoinColumns =
            @JoinColumn(name = "question_id")
    )
    @JsonIgnoreProperties({
        "hibernateLazyInitializer",
        "handler"
    })
    private List<QBank> questions;

    private Integer timeLimitMinutes;

    private Integer totalMarks;

    private String createdBy;

    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {

        createdAt = LocalDateTime.now();
    }
}