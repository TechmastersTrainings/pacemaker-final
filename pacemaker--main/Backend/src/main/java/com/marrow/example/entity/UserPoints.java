package com.marrow.example.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_points", indexes = {
    @Index(name = "idx_up_user_id", columnList = "user_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserPoints {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "total_points", nullable = false)
    private Integer totalPoints;

    @Column(name = "questions_answered", nullable = false)
    private Integer questionsAnswered;

    @Column(name = "daily_login_points", nullable = false)
    private Integer dailyLoginPoints;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    public void onSave() {
        updatedAt = LocalDateTime.now();
        if (totalPoints == null) totalPoints = 0;
        if (questionsAnswered == null) questionsAnswered = 0;
        if (dailyLoginPoints == null) dailyLoginPoints = 0;
    }
}
