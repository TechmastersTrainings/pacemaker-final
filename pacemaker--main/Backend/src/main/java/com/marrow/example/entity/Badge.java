package com.marrow.example.entity;

import com.marrow.example.enums.BadgeType;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "badges", indexes = {
    @Index(name = "idx_badge_type", columnList = "badge_type")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Badge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "badge_name", nullable = false, unique = true)
    private String badgeName;

    @Column(name = "badge_description", nullable = false)
    private String badgeDescription;

    @Column(name = "badge_image", nullable = false)
    private String badgeImage;

    @Enumerated(EnumType.STRING)
    @Column(name = "badge_type", nullable = false, unique = true)
    private BadgeType badgeType;

    @Column(name = "required_points", nullable = false)
    private Integer requiredPoints;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
