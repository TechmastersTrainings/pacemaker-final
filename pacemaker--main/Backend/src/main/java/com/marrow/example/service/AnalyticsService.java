package com.marrow.example.service;

import com.marrow.example.dto.StudentAnalyticsResponseDto;
import com.marrow.example.dto.SubjectPerformanceDto;
import com.marrow.example.dto.TimeSpentDto;
import com.marrow.example.entity.QuestionAttempt;
import com.marrow.example.entity.StudentPerformance;
import com.marrow.example.entity.Subject;
import com.marrow.example.entity.User;
import com.marrow.example.entity.UserActivity;
import com.marrow.example.enums.ActivityType;
import com.marrow.example.exception.ResourceNotFoundException;
import com.marrow.example.repository.QuestionAttemptRepository;
import com.marrow.example.repository.StudentPerformanceRepository;
import com.marrow.example.repository.SubjectRepository;
import com.marrow.example.repository.UserActivityRepository;
import com.marrow.example.repository.UserRepository;
import com.marrow.example.util.AnalyticsUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final StudentPerformanceRepository performanceRepository;
    private final UserActivityRepository activityRepository;
    private final QuestionAttemptRepository attemptRepository;
    private final UserRepository userRepository;
    private final SubjectRepository subjectRepository;

    @Cacheable(value = "studentAnalytics", key = "#root.target.getCurrentUser().id")
    public StudentAnalyticsResponseDto getStudentAnalytics() {
        User user = getCurrentUser();

        List<StudentPerformance> performances = performanceRepository.findByUserId(user.getId());
        List<UserActivity> activities = activityRepository.findByUserId(user.getId());
        long attemptedCount = attemptRepository.countByUserId(user.getId());

        double totalScore = performances.stream().mapToDouble(StudentPerformance::getScore).sum();
        double avgScore = performances.isEmpty() ? 0.0 : totalScore / performances.size();
        
        double totalAccuracy = performances.stream().mapToDouble(StudentPerformance::getAccuracyPercentage).sum();
        double avgAccuracy = performances.isEmpty() ? 0.0 : totalAccuracy / performances.size();

        long totalTimeSpentSeconds = activities.stream().mapToLong(UserActivity::getTimeSpentSeconds).sum();

        List<String> strongSubjects = performances.stream()
                .filter(p -> p.getAccuracyPercentage() >= 80.0)
                .map(p -> p.getSubject().getSubjectName())
                .collect(Collectors.toList());

        List<String> weakSubjects = performances.stream()
                .filter(p -> p.getAccuracyPercentage() < 60.0)
                .map(p -> p.getSubject().getSubjectName())
                .collect(Collectors.toList());

        return StudentAnalyticsResponseDto.builder()
                .overallScore((double) Math.round(avgScore))
                .accuracyPercentage((double) Math.round(avgAccuracy))
                .totalTimeSpent(AnalyticsUtil.formatTimeSpent(totalTimeSpentSeconds))
                .attemptedQuestions(attemptedCount)
                .strongSubjects(strongSubjects)
                .weakSubjects(weakSubjects)
                .build();
    }

    @Cacheable(value = "subjectAnalytics", key = "#subjectId + '-' + #root.target.getCurrentUser().id")
    public SubjectPerformanceDto getSubjectAnalytics(Long subjectId) {
        User user = getCurrentUser();
        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found"));

        StudentPerformance performance = performanceRepository.findByUserIdAndSubjectId(user.getId(), subjectId)
                .orElse(StudentPerformance.builder()
                        .subject(subject)
                        .totalQuestions(0)
                        .correctAnswers(0)
                        .accuracyPercentage(0.0)
                        .score(0.0)
                        .build());

        return SubjectPerformanceDto.builder()
                .subject(subject.getSubjectName())
                .totalQuestions(performance.getTotalQuestions())
                .correctAnswers(performance.getCorrectAnswers())
                .accuracy(performance.getAccuracyPercentage())
                .score(performance.getScore())
                .build();
    }

    @Cacheable(value = "timeAnalytics", key = "#root.target.getCurrentUser().id")
    public TimeSpentDto getTimeSpentAnalytics() {
        User user = getCurrentUser();
        List<UserActivity> activities = activityRepository.findByUserId(user.getId());

        Map<ActivityType, Long> timeMap = activities.stream()
                .collect(Collectors.groupingBy(UserActivity::getActivityType,
                        Collectors.summingLong(UserActivity::getTimeSpentSeconds)));

        return TimeSpentDto.builder()
                .video(AnalyticsUtil.formatTimeSpent(timeMap.getOrDefault(ActivityType.VIDEO, 0L)))
                .qbank(AnalyticsUtil.formatTimeSpent(timeMap.getOrDefault(ActivityType.QBANK, 0L)))
                .tests(AnalyticsUtil.formatTimeSpent(timeMap.getOrDefault(ActivityType.TEST, 0L)))
                .liveClasses(AnalyticsUtil.formatTimeSpent(timeMap.getOrDefault(ActivityType.LIVE_CLASS, 0L)))
                .build();
    }

    public User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
