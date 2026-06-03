package com.marrow.example.service;

import com.marrow.example.dto.SchedulerStatusDto;
import com.marrow.example.entity.SchedulerHistory;
import com.marrow.example.enums.JobStatus;
import com.marrow.example.repository.SchedulerHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SchedulerService {

    private final SchedulerHistoryRepository schedulerHistoryRepository;

    public void logJobExecution(String jobName, JobStatus status, int recordsProcessed, String errorMessage) {
        SchedulerHistory history = SchedulerHistory.builder()
                .jobName(jobName)
                .executionTime(LocalDateTime.now())
                .jobStatus(status)
                .recordsProcessed(recordsProcessed)
                .errorMessage(errorMessage)
                .build();
        schedulerHistoryRepository.save(history);
    }

    public List<SchedulerStatusDto> getSchedulerHistory() {
        return schedulerHistoryRepository.findAllByOrderByExecutionTimeDesc().stream()
                .map(h -> SchedulerStatusDto.builder()
                        .jobName(h.getJobName())
                        .status(h.getJobStatus().name())
                        .recordsProcessed(h.getRecordsProcessed())
                        .build())
                .collect(Collectors.toList());
    }
}
