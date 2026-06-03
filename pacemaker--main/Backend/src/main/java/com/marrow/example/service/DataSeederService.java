package com.marrow.example.service;

import com.marrow.example.dto.SeedResponseDto;
import com.marrow.example.dto.SeedStatusDto;
import com.marrow.example.entity.SubscriptionPlan;
import com.marrow.example.enums.SubscriptionType;
import com.marrow.example.repository.MockExamRepository;
import com.marrow.example.repository.QuestionRepository;
import com.marrow.example.repository.UserRepository;
import com.marrow.example.repository.SubscriptionPlanRepository;
import com.marrow.example.seeder.MockExamSeeder;
import com.marrow.example.seeder.QuestionSeeder;
import com.marrow.example.seeder.UserSeeder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class DataSeederService {

    private final UserSeeder userSeeder;
    private final QuestionSeeder questionSeeder;
    private final MockExamSeeder mockExamSeeder;
    
    private final UserRepository userRepository;
    private final QuestionRepository questionRepository;
    private final MockExamRepository mockExamRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;

    @Transactional
    public SeedResponseDto runSeedData() {
        log.info("Starting data seeding process...");
        
        // Seed subscription plans first
        seedSubscriptionPlans();
        
        userSeeder.seedSubjects();
        int trainers = userSeeder.seedTrainers();
        int students = userSeeder.seedStudents();
        int questions = questionSeeder.seedQuestions();
        int mockExams = mockExamSeeder.seedMockExams();

        return SeedResponseDto.builder()
                .studentsCreated(students)
                .trainersCreated(trainers)
                .questionsCreated(questions)
                .mockExamsCreated(mockExams)
                .build();
    }

    private void seedSubscriptionPlans() {
        if (subscriptionPlanRepository.count() == 0) {
            subscriptionPlanRepository.save(SubscriptionPlan.builder()
                    .planType(SubscriptionType.BASIC)
                    .price(2999.0)
                    .qbankAccess(false)
                    .videoAccess(false)
                    .liveClassAccess(false)
                    .aiAccess(false)
                    .description("Test Your Mettle: Grand Tests & Mock Exams Only")
                    .build());

            subscriptionPlanRepository.save(SubscriptionPlan.builder()
                    .planType(SubscriptionType.MEDIUM)
                    .price(4999.0)
                    .qbankAccess(true)
                    .videoAccess(false)
                    .liveClassAccess(false)
                    .aiAccess(false)
                    .description("Practice makes Perfect: Intelligent Q-Bank & Grand Tests")
                    .build());

            subscriptionPlanRepository.save(SubscriptionPlan.builder()
                    .planType(SubscriptionType.HIGH)
                    .price(9999.0)
                    .qbankAccess(true)
                    .videoAccess(true)
                    .liveClassAccess(true)
                    .aiAccess(true)
                    .description("The Ultimate Arsenal: Video Lectures, Intelligent Q-Bank & Grand Tests")
                    .build());
            log.info("Seeded 3 subscription plans (BASIC, MEDIUM, HIGH)");
        }
    }

    public SeedStatusDto getSeedStatus() {
        long students = userRepository.countByRole("STUDENT");
        long trainers = userRepository.countByRole("TRAINER");
        long questions = questionRepository.count();
        long mockExams = mockExamRepository.count();
        long total = students + trainers + questions + mockExams;
        
        return SeedStatusDto.builder()
                .completed(total > 0)
                .recordsCreated(total)
                .students(students)
                .trainers(trainers)
                .questions(questions)
                .mockExams(mockExams)
                .build();
    }
}
