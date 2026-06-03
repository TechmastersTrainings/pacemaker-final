package com.marrow.example.service;

import com.marrow.example.dto.RecordingResponseDto;
import com.marrow.example.entity.Recording;
import com.marrow.example.entity.Video;
import com.marrow.example.enums.JobStatus;
import com.marrow.example.enums.RecordingStatus;
import com.marrow.example.exception.ResourceNotFoundException;
import com.marrow.example.repository.RecordingRepository;
import com.marrow.example.util.RecordingUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecordingService {

    private final RecordingRepository recordingRepository;
    private final VideoLibraryService videoLibraryService;
    private final SchedulerService schedulerService;

    @Async
    public void fetchRecordingsAsync() {
        log.info("Starting asynchronous recording fetch and retry processing...");
        int processedCount = 0;
        try {
            // 1. Fetch mock new recordings (simulating live class platform / S3 webhook / Zoom cloud integration)
            List<Recording> newRecordings = List.of(
                    RecordingUtil.createMockRecording("Cardiology Masterclass - Live", 3600),
                    RecordingUtil.createMockRecording("Neurology Clinical Rounds - Live", 5400)
            );

            for (Recording rec : newRecordings) {
                if (!recordingRepository.existsByRecordingId(rec.getRecordingId())) {
                    rec.setRecordingStatus(RecordingStatus.PROCESSING);
                    Recording savedRec = recordingRepository.save(rec);
                    try {
                        Video video = videoLibraryService.createVideoFromRecording(savedRec);
                        if (video != null) {
                            savedRec.setVideo(video);
                            savedRec.setRecordingStatus(RecordingStatus.COMPLETED);
                            recordingRepository.save(savedRec);
                            processedCount++;
                        } else {
                            savedRec.setRecordingStatus(RecordingStatus.FAILED);
                            recordingRepository.save(savedRec);
                        }
                    } catch (Exception ex) {
                        log.error("Failed to process new recording {}: {}", savedRec.getRecordingId(), ex.getMessage());
                        savedRec.setRecordingStatus(RecordingStatus.FAILED);
                        recordingRepository.save(savedRec);
                    }
                }
            }

            // 2. Retry failed or pending recordings
            List<Recording> failedRecordings = recordingRepository.findByRecordingStatus(RecordingStatus.FAILED);
            List<Recording> pendingRecordings = recordingRepository.findByRecordingStatus(RecordingStatus.PENDING);

            for (Recording failedRec : failedRecordings) {
                log.info("Retrying failed recording: {}", failedRec.getRecordingId());
                failedRec.setRecordingStatus(RecordingStatus.PROCESSING);
                recordingRepository.save(failedRec);
                try {
                    Video video = videoLibraryService.createVideoFromRecording(failedRec);
                    if (video != null) {
                        failedRec.setVideo(video);
                        failedRec.setRecordingStatus(RecordingStatus.COMPLETED);
                        recordingRepository.save(failedRec);
                        processedCount++;
                    } else {
                        failedRec.setRecordingStatus(RecordingStatus.FAILED);
                        recordingRepository.save(failedRec);
                    }
                } catch (Exception ex) {
                    log.error("Retry failed for recording {}: {}", failedRec.getRecordingId(), ex.getMessage());
                    failedRec.setRecordingStatus(RecordingStatus.FAILED);
                    recordingRepository.save(failedRec);
                }
            }

            for (Recording pendingRec : pendingRecordings) {
                log.info("Processing pending recording: {}", pendingRec.getRecordingId());
                pendingRec.setRecordingStatus(RecordingStatus.PROCESSING);
                recordingRepository.save(pendingRec);
                try {
                    Video video = videoLibraryService.createVideoFromRecording(pendingRec);
                    if (video != null) {
                        pendingRec.setVideo(video);
                        pendingRec.setRecordingStatus(RecordingStatus.COMPLETED);
                        recordingRepository.save(pendingRec);
                        processedCount++;
                    } else {
                        pendingRec.setRecordingStatus(RecordingStatus.FAILED);
                        recordingRepository.save(pendingRec);
                    }
                } catch (Exception ex) {
                    log.error("Processing failed for pending recording {}: {}", pendingRec.getRecordingId(), ex.getMessage());
                    pendingRec.setRecordingStatus(RecordingStatus.FAILED);
                    recordingRepository.save(pendingRec);
                }
            }

            schedulerService.logJobExecution("Recording Scheduler", JobStatus.SUCCESS, processedCount, null);
            log.info("Successfully completed asynchronous recording fetch and retry. Processed {} total recordings.", processedCount);
        } catch (Exception e) {
            log.error("Recording fetch job failed: {}", e.getMessage(), e);
            schedulerService.logJobExecution("Recording Scheduler", JobStatus.FAILED, processedCount, e.getMessage());
        }
    }

    public RecordingResponseDto getRecordingStatus(String recordingId) {
        Recording recording = recordingRepository.findByRecordingId(recordingId)
                .orElseThrow(() -> new ResourceNotFoundException("Recording not found with ID: " + recordingId));
        return RecordingResponseDto.builder()
                .recordingId(recording.getRecordingId())
                .status(recording.getRecordingStatus().name())
                .title(recording.getTitle())
                .recordingUrl(recording.getRecordingUrl())
                .createdAt(recording.getCreatedAt())
                .build();
    }
}
