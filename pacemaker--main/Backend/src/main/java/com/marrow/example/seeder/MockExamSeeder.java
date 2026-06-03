package com.marrow.example.seeder;

import com.marrow.example.entity.MockExam;
import com.marrow.example.entity.Question;
import com.marrow.example.entity.Trainer;
import com.marrow.example.repository.MockExamRepository;
import com.marrow.example.repository.QuestionRepository;
import com.marrow.example.repository.TrainerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class MockExamSeeder {

    private final MockExamRepository mockExamRepository;
    private final QuestionRepository questionRepository;
    private final TrainerRepository trainerRepository;

    @Transactional
    public int seedMockExams() {
        if (mockExamRepository.count() >= 5) {
            log.info("Mock Exams already seeded");
            return 0;
        }

        List<Question> allQuestions = questionRepository.findAll();
        List<Trainer> allTrainers = trainerRepository.findAll();

        if (allQuestions.size() < 20 || allTrainers.isEmpty()) {
            log.warn("Not enough questions or trainers to seed mock exams");
            return 0;
        }

        List<MockExam> mockExams = new ArrayList<>();
        for (int i = 1; i <= 5; i++) {
            Collections.shuffle(allQuestions);
            List<Question> selectedQuestions = allQuestions.subList(0, 20);
            Trainer trainer = allTrainers.get(i % allTrainers.size());

            MockExam exam = MockExam.builder()
                    .examTitle("Mock Test " + i)
                    .description("Comprehensive mock exam covering multiple medical disciplines.")
                    .duration(120)
                    .totalQuestions(20)
                    .questions(new ArrayList<>(selectedQuestions))
                    .trainer(trainer)
                    .build();
            mockExams.add(exam);
        }

        mockExamRepository.saveAll(mockExams);
        log.info("Seeded 5 mock exams.");
        return 5;
    }
}
