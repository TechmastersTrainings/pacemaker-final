package com.marrow.example.service;

import com.marrow.example.dto.AnalyticsSummaryDto;
import com.marrow.example.entity.StudentPerformance;
import com.marrow.example.entity.User;
import com.marrow.example.entity.UserActivity;
import com.marrow.example.enums.PerformanceLevel;
import com.marrow.example.repository.StudentPerformanceRepository;
import com.marrow.example.repository.UserActivityRepository;
import com.marrow.example.util.AnalyticsUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StudentDashboardService {

    private final AnalyticsService analyticsService;
    private final StudentPerformanceRepository performanceRepository;
    private final UserActivityRepository activityRepository;

    @Cacheable(value = "dashboardSummary", key = "#root.target.getCurrentUser().id")
    public AnalyticsSummaryDto getDashboardSummary() {
        User user = getCurrentUser();

        List<StudentPerformance> performances = performanceRepository.findByUserId(user.getId());
        List<UserActivity> activities = activityRepository.findByUserId(user.getId());

        double totalScore = performances.stream().mapToDouble(StudentPerformance::getScore).sum();
        double avgScore = performances.isEmpty() ? 0.0 : totalScore / performances.size();
        long totalScoreRounded = Math.round(avgScore);

        PerformanceLevel level;
        if (totalScoreRounded >= 85) {
            level = PerformanceLevel.EXCELLENT;
        } else if (totalScoreRounded >= 70) {
            level = PerformanceLevel.GOOD;
        } else if (totalScoreRounded >= 50) {
            level = PerformanceLevel.AVERAGE;
        } else {
            level = PerformanceLevel.POOR;
        }

        long totalTimeSpentSeconds = activities.stream().mapToLong(UserActivity::getTimeSpentSeconds).sum();
        int completedActivities = activities.size(); // Or count specific completion flags if needed

        return AnalyticsSummaryDto.builder()
                .overallScore((double) totalScoreRounded)
                .performanceLevel(level.name())
                .completedActivities(completedActivities)
                .totalTimeSpent(AnalyticsUtil.formatTimeSpent(totalTimeSpentSeconds))
                .build();
    }

    public User getCurrentUser() {
        return analyticsService.getCurrentUser();
    }
}