package com.marrow.example.seeder;

import com.marrow.example.entity.Question;
import com.marrow.example.entity.Subject;
import com.marrow.example.enums.DifficultyLevel;
import com.marrow.example.repository.QuestionRepository;
import com.marrow.example.repository.SubjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.datafaker.Faker;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class QuestionSeeder {

    private final QuestionRepository questionRepository;
    private final SubjectRepository subjectRepository;

    @Transactional
    public int seedQuestions() {
        if (questionRepository.count() >= 100) {
            log.info("Questions already seeded");
            return 0;
        }

        Faker faker = new Faker();
        List<Subject> subjects = subjectRepository.findAll();
        if (subjects.isEmpty()) {
            log.warn("Cannot seed questions without subjects.");
            return 0;
        }

        List<Question> questions = new ArrayList<>();
        DifficultyLevel[] levels = DifficultyLevel.values();
        
        String[] possibleAnswers = {"A", "B", "C", "D"};

        for (int i = 0; i < 100; i++) {
            Subject subject = subjects.get(faker.number().numberBetween(0, subjects.size()));
            DifficultyLevel difficulty = levels[faker.number().numberBetween(0, levels.length)];

            String correctAns = possibleAnswers[faker.number().numberBetween(0, 4)];

            Question q = Question.builder()
                    .questionText(faker.medical().diseaseName() + " symptoms include " + faker.medical().symptoms() + ". Which of the following is the most appropriate treatment?")
                    .optionA(faker.medical().medicineName())
                    .optionB(faker.medical().medicineName())
                    .optionC(faker.medical().medicineName())
                    .optionD(faker.medical().medicineName())
                    .correctAnswer(correctAns)
                    .explanation(faker.lorem().paragraph(3))
                    .difficulty(difficulty)
                    .subject(subject)
                    .build();

            questions.add(q);
        }

        questionRepository.saveAll(questions);
        log.info("Seeded 100 medical questions.");
        return 100;
    }
}
