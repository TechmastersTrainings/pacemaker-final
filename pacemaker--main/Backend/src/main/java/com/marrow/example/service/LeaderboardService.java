package com.marrow.example.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.marrow.example.dto.LeaderboardResponse;
import com.marrow.example.repository.AttemptRepository;

@Service
public class LeaderboardService {

    private final AttemptRepository
            attemptRepository;

    public LeaderboardService(
            AttemptRepository
                    attemptRepository) {

        this.attemptRepository =
                attemptRepository;
    }

    // WEEKLY LEADERBOARD

    public List<LeaderboardResponse>
    getWeeklyLeaderboard() {

        LocalDateTime startDate =
                LocalDateTime.now()
                        .minusDays(7);

        return getLeaderboard(startDate);
    }

    // MONTHLY LEADERBOARD

    public List<LeaderboardResponse>
    getMonthlyLeaderboard() {

        LocalDateTime startDate =
                LocalDateTime.now()
                        .minusDays(30);

        return getLeaderboard(startDate);
    }

    // COMMON METHOD

    private List<LeaderboardResponse>
    getLeaderboard(
            LocalDateTime startDate) {

        List<Object[]> results =
                attemptRepository
                        .getLeaderboard(startDate);

        List<LeaderboardResponse>
                leaderboard =
                new ArrayList<>();

        for (Object[] row : results) {

            LeaderboardResponse response =
                    LeaderboardResponse
                            .builder()
                            .userId(
                                    (Long) row[0])
                            .totalScore(
                                    ((Number) row[1])
                                            .intValue())
                            .build();

            leaderboard.add(response);
        }

        return leaderboard;
    }
}