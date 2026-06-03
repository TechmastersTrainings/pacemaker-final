package com.marrow.example.service;

import com.marrow.example.dto.*;
import com.marrow.example.entity.*;
import com.marrow.example.enums.AchievementType;
import com.marrow.example.enums.BadgeType;
import com.marrow.example.enums.StreakStatus;
import com.marrow.example.exception.GamificationException;
import com.marrow.example.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class GamificationService {

    private final UserRepository userRepository;
    private final UserStreakRepository userStreakRepository;
    private final UserPointsRepository userPointsRepository;
    private final AchievementRepository achievementRepository;
    private final BadgeService badgeService;

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new GamificationException("User not found with email: " + email));
    }

    @Transactional
    public StreakResponseDto recordDailyLogin(String email) {
        User user = getUserByEmail(email);

        // 1. Handle Streak
        UserStreak streak = userStreakRepository.findByUserId(user.getId())
            .orElseGet(() -> UserStreak.builder()
                .user(user)
                .currentStreak(0)
                .highestStreak(0)
                .lastLoginDate(LocalDate.now().minusDays(1))
                .status(StreakStatus.ACTIVE)
                .build());

        LocalDate today = LocalDate.now();
        if (!streak.getLastLoginDate().isEqual(today)) {
            if (streak.getLastLoginDate().isEqual(today.minusDays(1))) {
                streak.setCurrentStreak(streak.getCurrentStreak() + 1);
            } else {
                streak.setStatus(StreakStatus.BROKEN);
                streak.setCurrentStreak(1);
                streak.setStatus(StreakStatus.ACTIVE);
            }
            streak.setLastLoginDate(today);
            if (streak.getCurrentStreak() > streak.getHighestStreak()) {
                streak.setHighestStreak(streak.getCurrentStreak());
            }
            userStreakRepository.save(streak);

            // 2. Handle Points
            UserPoints points = userPointsRepository.findByUserId(user.getId())
                .orElseGet(() -> UserPoints.builder()
                    .user(user)
                    .totalPoints(0)
                    .questionsAnswered(0)
                    .dailyLoginPoints(0)
                    .updatedAt(LocalDateTime.now())
                    .build());

            points.setDailyLoginPoints(points.getDailyLoginPoints() + 20);
            points.setTotalPoints(points.getTotalPoints() + 20);
            userPointsRepository.save(points);

            // 3. Record Achievement
            Achievement loginAchievement = Achievement.builder()
                .user(user)
                .achievementName("Daily Login Streak: " + streak.getCurrentStreak() + " days")
                .achievementType(AchievementType.LOGIN)
                .achievementDate(LocalDateTime.now())
                .build();
            achievementRepository.save(loginAchievement);

            // 4. Check Badges
            badgeService.checkAndAwardBadge(user, BadgeType.BEGINNER);
            if (streak.getCurrentStreak() >= 7) {
                badgeService.checkAndAwardBadge(user, BadgeType.CONSISTENT_LEARNER);
            }
            if (streak.getCurrentStreak() >= 30) {
                badgeService.checkAndAwardBadge(user, BadgeType.STREAK_KING);
            }
        }

        return StreakResponseDto.builder()
            .currentStreak(streak.getCurrentStreak())
            .highestStreak(streak.getHighestStreak())
            .build();
    }

    @Transactional
    public UserPointsDto recordQuestionActivity(String email, boolean isCorrect) {
        User user = getUserByEmail(email);

        UserPoints points = userPointsRepository.findByUserId(user.getId())
            .orElseGet(() -> UserPoints.builder()
                .user(user)
                .totalPoints(0)
                .questionsAnswered(0)
                .dailyLoginPoints(0)
                .updatedAt(LocalDateTime.now())
                .build());

        points.setQuestionsAnswered(points.getQuestionsAnswered() + 1);
        int pointsToAward = isCorrect ? 15 : 5;
        points.setTotalPoints(points.getTotalPoints() + pointsToAward);

        // Every 10 questions bonus points
        if (points.getQuestionsAnswered() % 10 == 0) {
            points.setTotalPoints(points.getTotalPoints() + 50);
            Achievement bonusAchievement = Achievement.builder()
                .user(user)
                .achievementName("Completed " + points.getQuestionsAnswered() + " Questions! (+50 bonus pts)")
                .achievementType(AchievementType.QUESTION)
                .achievementDate(LocalDateTime.now())
                .build();
            achievementRepository.save(bonusAchievement);
        }

        userPointsRepository.save(points);

        Achievement questionAchievement = Achievement.builder()
            .user(user)
            .achievementName("Answered Question (" + (isCorrect ? "Correct" : "Attempted") + ")")
            .achievementType(AchievementType.QUESTION)
            .achievementDate(LocalDateTime.now())
            .build();
        achievementRepository.save(questionAchievement);

        if (points.getQuestionsAnswered() >= 100) {
            badgeService.checkAndAwardBadge(user, BadgeType.QUESTION_MASTER);
        }
        if (points.getTotalPoints() >= 500) {
            badgeService.checkAndAwardBadge(user, BadgeType.TOP_PERFORMER);
        }

        return UserPointsDto.builder()
            .totalPoints(points.getTotalPoints())
            .questionsAnswered(points.getQuestionsAnswered())
            .build();
    }

    public StreakResponseDto getUserStreak(String email) {
        User user = getUserByEmail(email);
        UserStreak streak = userStreakRepository.findByUserId(user.getId())
            .orElse(UserStreak.builder().currentStreak(0).highestStreak(0).build());
        return StreakResponseDto.builder()
            .currentStreak(streak.getCurrentStreak())
            .highestStreak(streak.getHighestStreak())
            .build();
    }

    public List<BadgeResponseDto> getUserBadges(String email) {
        User user = getUserByEmail(email);
        return badgeService.getUserBadges(user.getId());
    }

    public UserPointsDto getUserPoints(String email) {
        User user = getUserByEmail(email);
        UserPoints points = userPointsRepository.findByUserId(user.getId())
            .orElse(UserPoints.builder().totalPoints(0).questionsAnswered(0).build());
        return UserPointsDto.builder()
            .totalPoints(points.getTotalPoints())
            .questionsAnswered(points.getQuestionsAnswered())
            .build();
    }

    public List<LeaderboardResponseDto> getGamificationLeaderboard() {
        List<UserPoints> pointsList = userPointsRepository.findAllByOrderByTotalPointsDesc();
        AtomicInteger rank = new AtomicInteger(1);
        return pointsList.stream().map(up -> LeaderboardResponseDto.builder()
            .rank(rank.getAndIncrement())
            .student(up.getUser().getName() != null ? up.getUser().getName() : up.getUser().getEmail())
            .points(up.getTotalPoints())
            .build()
        ).collect(Collectors.toList());
    }

    public List<AchievementResponseDto> getUserAchievements(String email) {
        User user = getUserByEmail(email);
        List<Achievement> achievements = achievementRepository.findByUserIdOrderByAchievementDateDesc(user.getId());
        return achievements.stream().map(a -> AchievementResponseDto.builder()
            .achievementName(a.getAchievementName())
            .achievementType(a.getAchievementType().name())
            .achievementDate(a.getAchievementDate())
            .build()
        ).collect(Collectors.toList());
    }
}
