package com.marrow.example.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "question_attempts", indexes = {
    @Index(name = "idx_qa_user", columnList = "user_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(name = "is_correct", nullable = false)
    private Boolean isCorrect;

    @Column(name = "time_taken_seconds", nullable = false)
    private Integer timeTakenSeconds;

    @Column(name = "attempt_date", nullable = false)
    private LocalDateTime attemptDate;

    @PrePersist
    public void prePersist() {
        if (this.attemptDate == null) {
            this.attemptDate = LocalDateTime.now();
        }
    }
}
