package com.marrow.example.service;

import com.marrow.example.dto.QuestionExportDto;
import com.marrow.example.dto.UserExportDto;
import com.marrow.example.entity.Question;
import com.marrow.example.entity.User;
import com.opencsv.CSVWriter;
import org.springframework.stereotype.Service;

import java.io.PrintWriter;
import java.util.List;

@Service
public class CsvExportService {

    public void writeUsersHeader(CSVWriter csvWriter) {
        String[] header = {"Name", "Email", "Role", "Status", "Created Date"};
        csvWriter.writeNext(header);
    }

    public void writeUsersBatch(CSVWriter csvWriter, List<User> users) {
        for (User user : users) {
            String[] data = {
                    user.getName(),
                    user.getEmail(),
                    user.getRole(),
                    user.getEnabled() != null && user.getEnabled() ? "ACTIVE" : "INACTIVE",
                    user.getCreatedAt() != null ? user.getCreatedAt().toString() : ""
            };
            csvWriter.writeNext(data);
        }
    }

    public void writeQuestionsHeader(CSVWriter csvWriter) {
        String[] header = {"Question", "Option A", "Option B", "Option C", "Option D", "Correct Answer", "Difficulty", "Subject", "Explanation"};
        csvWriter.writeNext(header);
    }

    public void writeQuestionsBatch(CSVWriter csvWriter, List<Question> questions) {
        for (Question q : questions) {
            String subjectName = q.getSubject() != null ? q.getSubject().getSubjectName() : "";
            String difficultyStr = q.getDifficulty() != null ? q.getDifficulty().name() : "";

            String[] data = {
                    q.getQuestionText(),
                    q.getOptionA(),
                    q.getOptionB(),
                    q.getOptionC(),
                    q.getOptionD(),
                    q.getCorrectAnswer(),
                    difficultyStr,
                    subjectName,
                    q.getExplanation()
            };
            csvWriter.writeNext(data);
        }
    }
}
