package com.marrow.example.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "mock_exams", indexes = {
    @Index(name = "idx_mock_exam_title", columnList = "exam_title")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MockExam {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "exam_title", nullable = false, unique = true)
    private String examTitle;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private Integer duration;

    @Column(name = "total_questions", nullable = false)
    private Integer totalQuestions;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "mock_exam_questions",
        joinColumns = @JoinColumn(name = "mock_exam_id"),
        inverseJoinColumns = @JoinColumn(name = "question_id")
    )
    @Builder.Default
    private List<Question> questions = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trainer_id")
    private Trainer trainer;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
