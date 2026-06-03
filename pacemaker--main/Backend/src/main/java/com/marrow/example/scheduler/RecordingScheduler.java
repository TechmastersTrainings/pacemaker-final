package com.marrow.example.scheduler;

import com.marrow.example.service.RecordingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class RecordingScheduler {

    private final RecordingService recordingService;

    @Scheduled(fixedRate = 600000)
    public void scheduleRecordingFetch() {
        log.info("Triggered scheduled background job: Fetching completed live class recordings");
        recordingService.fetchRecordingsAsync();
    }
}
