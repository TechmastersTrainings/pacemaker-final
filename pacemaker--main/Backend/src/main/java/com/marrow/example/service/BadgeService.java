package com.marrow.example.service;

import com.marrow.example.dto.BadgeResponseDto;
import com.marrow.example.entity.Badge;
import com.marrow.example.entity.User;
import com.marrow.example.entity.UserBadge;
import com.marrow.example.entity.Achievement;
import com.marrow.example.enums.AchievementType;
import com.marrow.example.enums.BadgeType;
import com.marrow.example.exception.BadgeException;
import com.marrow.example.repository.AchievementRepository;
import com.marrow.example.repository.BadgeRepository;
import com.marrow.example.repository.UserBadgeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BadgeService {

    private final BadgeRepository badgeRepository;
    private final UserBadgeRepository userBadgeRepository;
    private final AchievementRepository achievementRepository;

    @Transactional
    public void checkAndAwardBadge(User user, BadgeType badgeType) {
        Badge badge = badgeRepository.findByBadgeType(badgeType)
            .orElseThrow(() -> new BadgeException("Badge type not found: " + badgeType));

        boolean alreadyEarned = userBadgeRepository.existsByUserIdAndBadgeId(user.getId(), badge.getId());
        if (!alreadyEarned) {
            log.info("Awarding badge {} to user {}", badge.getBadgeName(), user.getEmail());
            UserBadge userBadge = UserBadge.builder()
                .user(user)
                .badge(badge)
                .earnedDate(LocalDate.now())
                .build();
            userBadgeRepository.save(userBadge);

            Achievement achievement = Achievement.builder()
                .user(user)
                .achievementName(badge.getBadgeName())
                .achievementType(AchievementType.BADGE)
                .achievementDate(LocalDateTime.now())
                .build();
            achievementRepository.save(achievement);
        }
    }

    public List<BadgeResponseDto> getUserBadges(Long userId) {
        List<UserBadge> userBadges = userBadgeRepository.findByUserId(userId);
        return userBadges.stream().map(ub -> BadgeResponseDto.builder()
            .badgeName(ub.getBadge().getBadgeName())
            .badgeDescription(ub.getBadge().getBadgeDescription())
            .badgeImage(ub.getBadge().getBadgeImage())
            .badgeType(ub.getBadge().getBadgeType().name())
            .earnedDate(ub.getEarnedDate())
            .build()
        ).collect(Collectors.toList());
    }

    public List<BadgeResponseDto> getAllBadges() {
        return badgeRepository.findAll().stream().map(b -> BadgeResponseDto.builder()
            .badgeName(b.getBadgeName())
            .badgeDescription(b.getBadgeDescription())
            .badgeImage(b.getBadgeImage())
            .badgeType(b.getBadgeType().name())
            .earnedDate(LocalDate.now())
            .build()
        ).collect(Collectors.toList());
    }
}
