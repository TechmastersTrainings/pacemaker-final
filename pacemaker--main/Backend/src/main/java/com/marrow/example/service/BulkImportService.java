package com.marrow.example.service;

import com.marrow.example.config.FileUploadConfig;
import com.marrow.example.dto.*;
import com.marrow.example.entity.*;
import com.marrow.example.enums.*;
import com.marrow.example.exception.BulkImportException;
import com.marrow.example.exception.ResourceNotFoundException;
import com.marrow.example.repository.*;
import com.marrow.example.util.CsvParserUtil;
import com.marrow.example.util.ExcelParserUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BulkImportService {

    private final ImportHistoryRepository historyRepository;
    private final ValidationErrorRepository errorRepository;
    private final QuestionRepository questionRepository;
    private final VideoRepository videoRepository;
    private final LiveClassRepository liveClassRepository;
    private final SubjectRepository subjectRepository;
    private final ValidationService validationService;

    @Transactional
    public BulkImportResponseDto importMCQs(MultipartFile file) {
        validateFile(file);
        String fileName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "mcq.xlsx";
        log.info("Starting bulk MCQ import for file: {}", fileName);

        ImportHistory history = createPendingHistory(fileName, ImportType.MCQ);

        List<MCQImportDto> dtoList;
        try {
            if (fileName.endsWith(".csv")) {
                dtoList = CsvParserUtil.parseMCQCsv(file);
            } else {
                dtoList = ExcelParserUtil.parseMCQExcel(file);
            }
        } catch (Exception e) {
            log.error("Failed to parse file: {}", fileName, e);
            updateHistoryOnException(history, e);
            throw new BulkImportException("Failed to parse file: " + e.getMessage(), e);
        }

        List<ValidationErrorLog> errorLogs = new ArrayList<>();
        List<Question> validQuestions = new ArrayList<>();

        for (MCQImportDto dto : dtoList) {
            if (validationService.validateMCQ(dto, history, errorLogs)) {
                Subject subject = subjectRepository.findBySubjectName(dto.getSubject())
                        .orElseGet(() -> subjectRepository.save(Subject.builder().subjectName(dto.getSubject()).build()));

                DifficultyLevel diff = DifficultyLevel.MEDIUM;
                try {
                    diff = DifficultyLevel.valueOf(dto.getDifficulty().toUpperCase());
                } catch (Exception ignored) {}

                Question question = Question.builder()
                        .questionText(dto.getQuestion())
                        .optionA(dto.getOptionA())
                        .optionB(dto.getOptionB())
                        .optionC(dto.getOptionC())
                        .optionD(dto.getOptionD())
                        .correctAnswer(dto.getCorrectAnswer())
                        .explanation(dto.getExplanation() != null ? dto.getExplanation() : "")
                        .difficulty(diff)
                        .subject(subject)
                        .topic(dto.getTopic() != null ? dto.getTopic() : "")
                        .build();

                validQuestions.add(question);
            }
        }

        if (!validQuestions.isEmpty()) {
            questionRepository.saveAll(validQuestions);
        }

        return updateAndSaveHistory(history, dtoList.size(), validQuestions.size(), errorLogs);
    }

    @Transactional
    public BulkImportResponseDto importVideos(MultipartFile file) {
        validateFile(file);
        String fileName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "video.xlsx";
        log.info("Starting bulk Video import for file: {}", fileName);

        ImportHistory history = createPendingHistory(fileName, ImportType.VIDEO);

        List<VideoImportDto> dtoList;
        try {
            if (fileName.endsWith(".csv")) {
                dtoList = CsvParserUtil.parseVideoCsv(file);
            } else {
                dtoList = ExcelParserUtil.parseVideoExcel(file);
            }
        } catch (Exception e) {
            updateHistoryOnException(history, e);
            throw new BulkImportException("Failed to parse file: " + e.getMessage(), e);
        }

        List<ValidationErrorLog> errorLogs = new ArrayList<>();
        List<Video> validVideos = new ArrayList<>();

        for (VideoImportDto dto : dtoList) {
            if (validationService.validateVideo(dto, history, errorLogs)) {
                VideoCategory cat = VideoCategory.MEDICINE;
                try {
                    cat = VideoCategory.valueOf(dto.getCategory().toUpperCase());
                } catch (Exception ignored) {}

                Video video = Video.builder()
                        .title(dto.getTitle())
                        .description(dto.getDescription() != null ? dto.getDescription() : "")
                        .videoUrl(dto.getVideoUrl())
                        .duration(dto.getDuration())
                        .accessLevel(AccessLevel.FREE)
                        .category(cat)
                        .build();

                validVideos.add(video);
            }
        }

        if (!validVideos.isEmpty()) {
            videoRepository.saveAll(validVideos);
        }

        return updateAndSaveHistory(history, dtoList.size(), validVideos.size(), errorLogs);
    }

    @Transactional
    public BulkImportResponseDto importLiveClasses(MultipartFile file) {
        validateFile(file);
        String fileName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "live_class.xlsx";
        log.info("Starting bulk Live Class import for file: {}", fileName);

        ImportHistory history = createPendingHistory(fileName, ImportType.LIVE_CLASS);

        List<LiveClassImportDto> dtoList;
        try {
            if (fileName.endsWith(".csv")) {
                dtoList = CsvParserUtil.parseLiveClassCsv(file);
            } else {
                dtoList = ExcelParserUtil.parseLiveClassExcel(file);
            }
        } catch (Exception e) {
            updateHistoryOnException(history, e);
            throw new BulkImportException("Failed to parse file: " + e.getMessage(), e);
        }

        List<ValidationErrorLog> errorLogs = new ArrayList<>();
        List<LiveClass> validLiveClasses = new ArrayList<>();

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

        for (LiveClassImportDto dto : dtoList) {
            if (validationService.validateLiveClass(dto, history, errorLogs)) {
                LocalDateTime schedule = LocalDateTime.now().plusDays(1);
                try {
                    schedule = LocalDateTime.parse(dto.getSchedule(), formatter);
                } catch (Exception ignored) {}

                LiveClass liveClass = LiveClass.builder()
                        .title(dto.getTitle())
                        .trainerName(dto.getTrainer())
                        .classDateTime(schedule)
                        .zoomJoinUrl(dto.getZoomJoinUrl() != null ? dto.getZoomJoinUrl() : "http://zoom.us/demo")
                        .topic(dto.getTopic() != null ? dto.getTopic() : "")
                        .description(dto.getDescription() != null ? dto.getDescription() : "")
                        .build();

                validLiveClasses.add(liveClass);
            }
        }

        if (!validLiveClasses.isEmpty()) {
            liveClassRepository.saveAll(validLiveClasses);
        }

        return updateAndSaveHistory(history, dtoList.size(), validLiveClasses.size(), errorLogs);
    }

    public List<BulkImportResponseDto> getImportHistory() {
        return historyRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(h -> BulkImportResponseDto.builder()
                        .fileName(h.getFileName())
                        .status(h.getImportStatus().name())
                        .totalRecords(h.getTotalRecords())
                        .successfulRecords(h.getSuccessfulRecords())
                        .failedRecords(h.getFailedRecords())
                        .build())
                .collect(Collectors.toList());
    }

    public List<ValidationErrorDto> getValidationErrors(Long importId) {
        return errorRepository.findByImportHistoryId(importId).stream()
                .map(err -> ValidationErrorDto.builder()
                        .recordNumber(err.getRecordNumber())
                        .fieldName(err.getFieldName())
                        .errorMessage(err.getErrorMessage())
                        .build())
                .collect(Collectors.toList());
    }

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new BulkImportException("Uploaded file is empty");
        }
        if (file.getSize() > FileUploadConfig.MAX_FILE_SIZE) {
            throw new BulkImportException("File size exceeds limit of 10MB");
        }
        String name = file.getOriginalFilename();
        if (name == null || (!name.endsWith(".xlsx") && !name.endsWith(".xls") && !name.endsWith(".csv"))) {
            throw new BulkImportException("Only Excel (.xlsx, .xls) and CSV (.csv) files are allowed");
        }
    }

    private ImportHistory createPendingHistory(String fileName, ImportType type) {
        String uploader = "admin@pacemaker.com";
        try {
            uploader = SecurityContextHolder.getContext().getAuthentication().getName();
        } catch (Exception ignored) {}

        ImportHistory history = ImportHistory.builder()
                .fileName(fileName)
                .importType(type)
                .totalRecords(0)
                .successfulRecords(0)
                .failedRecords(0)
                .importStatus(ImportStatus.PENDING)
                .uploadedBy(uploader)
                .build();

        return historyRepository.save(history);
    }

    private BulkImportResponseDto updateAndSaveHistory(ImportHistory history, int total, int success, List<ValidationErrorLog> errorLogs) {
        int failed = total - success;
        ImportStatus status = (failed == 0) ? ImportStatus.SUCCESS : ((success == 0) ? ImportStatus.FAILED : ImportStatus.PARTIAL_SUCCESS);

        history.setTotalRecords(total);
        history.setSuccessfulRecords(success);
        history.setFailedRecords(failed);
        history.setImportStatus(status);
        history.getValidationErrorLogs().addAll(errorLogs);

        historyRepository.save(history);

        return BulkImportResponseDto.builder()
                .fileName(history.getFileName())
                .status(status.name())
                .totalRecords(total)
                .successfulRecords(success)
                .failedRecords(failed)
                .build();
    }

    private void updateHistoryOnException(ImportHistory history, Exception e) {
        history.setImportStatus(ImportStatus.FAILED);
        ValidationErrorLog errorLog = ValidationErrorLog.builder()
                .importHistory(history)
                .recordNumber(0)
                .fieldName("File")
                .errorMessage("Fatal parse error: " + e.getMessage())
                .build();
        history.getValidationErrorLogs().add(errorLog);
        historyRepository.save(history);
    }
}
