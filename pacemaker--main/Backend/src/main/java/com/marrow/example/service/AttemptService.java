package com.marrow.example.service;

import org.springframework.stereotype.Service;


import com.marrow.example.dto.AttemptRequest;
import com.marrow.example.entity.Attempt;
import com.marrow.example.repository.AttemptRepository;

@Service
public class AttemptService {

    private final AttemptRepository
            attemptRepository;

    public AttemptService(
            AttemptRepository attemptRepository) {

        this.attemptRepository =
                attemptRepository;
    }

    public Attempt submitAttempt(
            AttemptRequest request) {

        // TEMP SCORE CALCULATION

        Integer score = 80;

        Attempt attempt =
                Attempt.builder()
                        .studentId(
                                request.getStudentId())
                        .examId(
                                request.getExamId())
                        .studentAnswers(
                                request.getStudentAnswers())
                        .score(score)
                        .build();

        return attemptRepository.save(attempt);
    }
}