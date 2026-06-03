package com.marrow.example.entity;

import com.marrow.example.enums.StreakStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "user_streak", indexes = {
    @Index(name = "idx_us_user_id", columnList = "user_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserStreak {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "current_streak", nullable = false)
    private Integer currentStreak;

    @Column(name = "highest_streak", nullable = false)
    private Integer highestStreak;

    @Column(name = "last_login_date", nullable = false)
    private LocalDate lastLoginDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StreakStatus status;

    @PrePersist
    public void prePersist() {
        if (currentStreak == null) currentStreak = 1;
        if (highestStreak == null) highestStreak = 1;
        if (lastLoginDate == null) lastLoginDate = LocalDate.now();
        if (status == null) status = StreakStatus.ACTIVE;
    }
}
