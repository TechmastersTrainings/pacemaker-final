package com.marrow.example.util;

import com.marrow.example.entity.Badge;
import com.marrow.example.enums.BadgeType;
import java.time.LocalDateTime;
import java.util.List;

public class BadgeUtil {

    public static List<Badge> getDefaultBadges() {
        return List.of(
            Badge.builder()
                .badgeName("Beginner")
                .badgeDescription("Complete first login")
                .badgeImage("https://s3.amazonaws.com/pacemaker-badges/beginner.png")
                .badgeType(BadgeType.BEGINNER)
                .requiredPoints(10)
                .createdAt(LocalDateTime.now())
                .build(),
            Badge.builder()
                .badgeName("Consistent Learner")
                .badgeDescription("Maintain 7 day streak")
                .badgeImage("https://s3.amazonaws.com/pacemaker-badges/consistent.png")
                .badgeType(BadgeType.CONSISTENT_LEARNER)
                .requiredPoints(50)
                .createdAt(LocalDateTime.now())
                .build(),
            Badge.builder()
                .badgeName("Question Master")
                .badgeDescription("Answer 100 questions")
                .badgeImage("https://s3.amazonaws.com/pacemaker-badges/question_master.png")
                .badgeType(BadgeType.QUESTION_MASTER)
                .requiredPoints(200)
                .createdAt(LocalDateTime.now())
                .build(),
            Badge.builder()
                .badgeName("Top Performer")
                .badgeDescription("Score >90%")
                .badgeImage("https://s3.amazonaws.com/pacemaker-badges/top_performer.png")
                .badgeType(BadgeType.TOP_PERFORMER)
                .requiredPoints(500)
                .createdAt(LocalDateTime.now())
                .build(),
            Badge.builder()
                .badgeName("Streak King")
                .badgeDescription("Maintain 30 day streak")
                .badgeImage("https://s3.amazonaws.com/pacemaker-badges/streak_king.png")
                .badgeType(BadgeType.STREAK_KING)
                .requiredPoints(1000)
                .createdAt(LocalDateTime.now())
                .build()
        );
    }
}
