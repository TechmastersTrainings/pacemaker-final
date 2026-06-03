package com.marrow.example.controller;

import com.marrow.example.dto.*;
import com.marrow.example.service.GamificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/gamification")
@RequiredArgsConstructor
@Tag(name = "Gamification API", description = "Endpoints for badges, streaks, points, and leaderboard")
public class GamificationController {

    private final GamificationService gamificationService;

    @PostMapping("/login")
    @Operation(summary = "Record user daily login and update streaks/points")
    public ResponseEntity<StreakResponseDto> recordLogin(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(gamificationService.recordDailyLogin(email));
    }

    @PostMapping("/question")
    @Operation(summary = "Record user question activity and award points")
    public ResponseEntity<UserPointsDto> recordQuestionActivity(
            Authentication authentication,
            @RequestParam(defaultValue = "true") boolean isCorrect) {
        String email = authentication.getName();
        return ResponseEntity.ok(gamificationService.recordQuestionActivity(email, isCorrect));
    }

    @GetMapping("/streak")
    @Operation(summary = "Get user current and highest streak")
    public ResponseEntity<StreakResponseDto> getUserStreak(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(gamificationService.getUserStreak(email));
    }

    @GetMapping("/badges")
    @Operation(summary = "Get badges earned by user")
    public ResponseEntity<List<BadgeResponseDto>> getUserBadges(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(gamificationService.getUserBadges(email));
    }

    @GetMapping("/points")
    @Operation(summary = "Get total points and question count for user")
    public ResponseEntity<UserPointsDto> getUserPoints(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(gamificationService.getUserPoints(email));
    }

    @GetMapping("/leaderboard")
    @Operation(summary = "Get gamification student leaderboard")
    public ResponseEntity<List<LeaderboardResponseDto>> getLeaderboard() {
        return ResponseEntity.ok(gamificationService.getGamificationLeaderboard());
    }

    @GetMapping("/achievements")
    @Operation(summary = "Get user achievement history")
    public ResponseEntity<List<AchievementResponseDto>> getUserAchievements(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(gamificationService.getUserAchievements(email));
    }
}
