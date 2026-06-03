package com.marrow.example.service;

import com.marrow.example.dto.ExportHistoryDto;
import com.marrow.example.entity.ExportHistory;
import com.marrow.example.entity.Question;
import com.marrow.example.entity.User;
import com.marrow.example.enums.ExportStatus;
import com.marrow.example.enums.ExportType;
import com.marrow.example.enums.DifficultyLevel;
import com.marrow.example.exception.ExportException;
import com.marrow.example.repository.ExportHistoryRepository;
import com.marrow.example.repository.QuestionRepository;
import com.marrow.example.repository.UserRepository;
import com.opencsv.CSVWriter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExportService {

    private final UserRepository userRepository;
    private final QuestionRepository questionRepository;
    private final ExportHistoryRepository exportHistoryRepository;
    private final CsvExportService csvExportService;

    @Transactional
    public void exportUsers(String role, int page, int size, HttpServletResponse response) {
        String fileName = "users.csv";
        response.setContentType("text/csv");
        response.setHeader("Content-Disposition", "attachment; filename=\"" + fileName + "\"");

        User admin = getCurrentUser();
        ExportHistory history = createPendingHistory(fileName, ExportType.USER_EXPORT, admin);
        long totalRecords = 0;

        try (CSVWriter csvWriter = new CSVWriter(response.getWriter())) {
            csvExportService.writeUsersHeader(csvWriter);

            Pageable pageable = PageRequest.of(page, size);
            Page<User> userPage;
            
            do {
                if (role != null && !role.isEmpty()) {
                    userPage = userRepository.findByRole(role, pageable);
                } else {
                    userPage = userRepository.findAll(pageable);
                }

                csvExportService.writeUsersBatch(csvWriter, userPage.getContent());
                totalRecords += userPage.getNumberOfElements();
                
                pageable = userPage.hasNext() ? userPage.nextPageable() : null;
            } while (pageable != null);

            history.setExportStatus(ExportStatus.SUCCESS);
            history.setRecordCount(totalRecords);
            exportHistoryRepository.save(history);

        } catch (IOException e) {
            history.setExportStatus(ExportStatus.FAILED);
            exportHistoryRepository.save(history);
            throw new ExportException("Failed to export users data");
        }
    }

    @Transactional
    public void exportQuestions(DifficultyLevel difficulty, int page, int size, HttpServletResponse response) {
        String fileName = "questions.csv";
        response.setContentType("text/csv");
        response.setHeader("Content-Disposition", "attachment; filename=\"" + fileName + "\"");

        User admin = getCurrentUser();
        ExportHistory history = createPendingHistory(fileName, ExportType.QUESTION_EXPORT, admin);
        long totalRecords = 0;

        try (CSVWriter csvWriter = new CSVWriter(response.getWriter())) {
            csvExportService.writeQuestionsHeader(csvWriter);

            Pageable pageable = PageRequest.of(page, size);
            Page<Question> questionPage;

            do {
                if (difficulty != null) {
                    questionPage = questionRepository.findByDifficulty(difficulty, pageable);
                } else {
                    questionPage = questionRepository.findAll(pageable);
                }

                csvExportService.writeQuestionsBatch(csvWriter, questionPage.getContent());
                totalRecords += questionPage.getNumberOfElements();

                pageable = questionPage.hasNext() ? questionPage.nextPageable() : null;
            } while (pageable != null);

            history.setExportStatus(ExportStatus.SUCCESS);
            history.setRecordCount(totalRecords);
            exportHistoryRepository.save(history);

        } catch (IOException e) {
            history.setExportStatus(ExportStatus.FAILED);
            exportHistoryRepository.save(history);
            throw new ExportException("Failed to export questions data");
        }
    }

    public List<ExportHistoryDto> getExportHistory() {
        return exportHistoryRepository.findAll().stream().map(h -> ExportHistoryDto.builder()
                .fileName(h.getFileName())
                .exportType(h.getExportType().name())
                .status(h.getExportStatus().name())
                .recordCount(h.getRecordCount())
                .build()).collect(Collectors.toList());
    }

    private ExportHistory createPendingHistory(String fileName, ExportType type, User user) {
        ExportHistory history = ExportHistory.builder()
                .fileName(fileName)
                .exportType(type)
                .exportStatus(ExportStatus.PROCESSING)
                .requestedBy(user)
                .build();
        return exportHistoryRepository.save(history);
    }

    private User getCurrentUser() {
        String email = null;
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
             email = SecurityContextHolder.getContext().getAuthentication().getName();
        }
        
        if (email != null && !email.equals("anonymousUser")) {
             return userRepository.findByEmail(email).orElseGet(() -> userRepository.findAll().stream().findFirst().orElseThrow(() -> new ExportException("No valid admin user found")));
        }
        return userRepository.findAll().stream().findFirst().orElseThrow(() -> new ExportException("No user found in DB"));
    }
}
