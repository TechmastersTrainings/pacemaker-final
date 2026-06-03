package com.marrow.example.service;

import com.marrow.example.dto.LiveClassImportDto;
import com.marrow.example.dto.MCQImportDto;
import com.marrow.example.dto.VideoImportDto;
import com.marrow.example.entity.ImportHistory;
import com.marrow.example.entity.ValidationErrorLog;
import com.marrow.example.repository.LiveClassRepository;
import com.marrow.example.repository.QuestionRepository;
import com.marrow.example.repository.VideoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ValidationService {

    private final QuestionRepository questionRepository;
    private final VideoRepository videoRepository;
    private final LiveClassRepository liveClassRepository;

    public boolean validateMCQ(MCQImportDto dto, ImportHistory history, List<ValidationErrorLog> errorLogs) {
        boolean valid = true;

        if (dto.getQuestion() == null || dto.getQuestion().isEmpty()) {
            addError(history, dto.getRecordNumber(), "Question", "Question cannot be empty", errorLogs);
            valid = false;
        }
        if (dto.getOptionA() == null || dto.getOptionA().isEmpty() ||
            dto.getOptionB() == null || dto.getOptionB().isEmpty() ||
            dto.getOptionC() == null || dto.getOptionC().isEmpty() ||
            dto.getOptionD() == null || dto.getOptionD().isEmpty()) {
            addError(history, dto.getRecordNumber(), "Options", "Minimum 4 options required", errorLogs);
            valid = false;
        }
        if (dto.getCorrectAnswer() == null || dto.getCorrectAnswer().isEmpty()) {
            addError(history, dto.getRecordNumber(), "CorrectAnswer", "Correct answer required", errorLogs);
            valid = false;
        }
        if (dto.getSubject() == null || dto.getSubject().isEmpty()) {
            addError(history, dto.getRecordNumber(), "Subject", "Subject required", errorLogs);
            valid = false;
        }

        if (valid && questionRepository.existsByQuestionText(dto.getQuestion())) {
            addError(history, dto.getRecordNumber(), "Question", "Duplicate record found in database", errorLogs);
            valid = false;
        }

        return valid;
    }

    public boolean validateVideo(VideoImportDto dto, ImportHistory history, List<ValidationErrorLog> errorLogs) {
        boolean valid = true;

        if (dto.getTitle() == null || dto.getTitle().isEmpty()) {
            addError(history, dto.getRecordNumber(), "Title", "Title required", errorLogs);
            valid = false;
        }
        if (dto.getVideoUrl() == null || dto.getVideoUrl().isEmpty()) {
            addError(history, dto.getRecordNumber(), "VideoUrl", "Video URL required", errorLogs);
            valid = false;
        }
        if (dto.getDuration() == null || dto.getDuration() <= 0) {
            addError(history, dto.getRecordNumber(), "Duration", "Duration required and must be greater than 0", errorLogs);
            valid = false;
        }

        if (valid && videoRepository.existsByTitleOrVideoUrl(dto.getTitle(), dto.getVideoUrl())) {
            addError(history, dto.getRecordNumber(), "Title/VideoUrl", "Duplicate record found in database", errorLogs);
            valid = false;
        }

        return valid;
    }

    public boolean validateLiveClass(LiveClassImportDto dto, ImportHistory history, List<ValidationErrorLog> errorLogs) {
        boolean valid = true;

        if (dto.getTitle() == null || dto.getTitle().isEmpty()) {
            addError(history, dto.getRecordNumber(), "Title", "Title required", errorLogs);
            valid = false;
        }
        if (dto.getTrainer() == null || dto.getTrainer().isEmpty()) {
            addError(history, dto.getRecordNumber(), "Trainer", "Trainer required", errorLogs);
            valid = false;
        }
        if (dto.getSchedule() == null || dto.getSchedule().isEmpty()) {
            addError(history, dto.getRecordNumber(), "Schedule", "Schedule required", errorLogs);
            valid = false;
        }

        if (valid && liveClassRepository.existsByTitle(dto.getTitle())) {
            addError(history, dto.getRecordNumber(), "Title", "Duplicate record found in database", errorLogs);
            valid = false;
        }

        return valid;
    }

    private void addError(ImportHistory history, int recordNum, String field, String msg, List<ValidationErrorLog> logs) {
        ValidationErrorLog errorLog = ValidationErrorLog.builder()
                .importHistory(history)
                .recordNumber(recordNum)
                .fieldName(field)
                .errorMessage(msg)
                .build();
        logs.add(errorLog);
    }
}
