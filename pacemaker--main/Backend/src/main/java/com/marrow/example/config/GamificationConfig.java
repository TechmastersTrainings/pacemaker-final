package com.marrow.example.config;

import com.marrow.example.entity.Badge;
import com.marrow.example.repository.BadgeRepository;
import com.marrow.example.util.BadgeUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.util.List;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class GamificationConfig {

    private final BadgeRepository badgeRepository;

    @Bean
    public CommandLineRunner initBadges() {
        return args -> {
            log.info("Initializing gamification badges...");
            List<Badge> defaultBadges = BadgeUtil.getDefaultBadges();
            for (Badge b : defaultBadges) {
                if (badgeRepository.findByBadgeType(b.getBadgeType()).isEmpty()) {
                    badgeRepository.save(b);
                    log.info("Initialized badge: {}", b.getBadgeName());
                }
            }
        };
    }
}
