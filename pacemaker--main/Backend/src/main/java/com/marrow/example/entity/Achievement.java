package com.marrow.example.entity;

import com.marrow.example.enums.AchievementType;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "achievements", indexes = {
    @Index(name = "idx_ach_user_id", columnList = "user_id"),
    @Index(name = "idx_ach_date", columnList = "achievement_date")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Achievement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "achievement_name", nullable = false)
    private String achievementName;

    @Enumerated(EnumType.STRING)
    @Column(name = "achievement_type", nullable = false)
    private AchievementType achievementType;

    @Column(name = "achievement_date", nullable = false)
    private LocalDateTime achievementDate;

    @PrePersist
    public void prePersist() {
        if (achievementDate == null) {
            achievementDate = LocalDateTime.now();
        }
    }
}
