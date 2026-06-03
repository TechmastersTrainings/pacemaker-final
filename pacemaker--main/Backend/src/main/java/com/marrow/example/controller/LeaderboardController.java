package com.marrow.example.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.marrow.example.dto.LeaderboardResponse;
import com.marrow.example.service.LeaderboardService;

@RestController
@RequestMapping("/api/v1/leaderboard")

public class LeaderboardController {

    private final LeaderboardService
            leaderboardService;

    public LeaderboardController(
            LeaderboardService
                    leaderboardService) {

        this.leaderboardService =
                leaderboardService;
    }

    // WEEKLY LEADERBOARD

    @GetMapping("/weekly")

    public List<LeaderboardResponse>
    getWeeklyLeaderboard() {

        return leaderboardService
                .getWeeklyLeaderboard();
    }

    // MONTHLY LEADERBOARD

    @GetMapping("/monthly")

    public List<LeaderboardResponse>
    getMonthlyLeaderboard() {

        return leaderboardService
                .getMonthlyLeaderboard();
    }
}