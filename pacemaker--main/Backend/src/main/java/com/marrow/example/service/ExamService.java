package com.marrow.example.service;

import java.util.List;
import com.marrow.example.exception.ResourceNotFoundException;

import org.springframework.stereotype.Service;

import com.marrow.example.dto.ExamRequest;
import com.marrow.example.entity.Exam;
import com.marrow.example.entity.QBank;
import com.marrow.example.repository.ExamRepository;
import com.marrow.example.repository.QBankRepository;

@Service
public class ExamService {

    private final ExamRepository examRepository;

    private final QBankRepository qBankRepository;

    public ExamService(
            ExamRepository examRepository,
            QBankRepository qBankRepository) {

        this.examRepository = examRepository;
        this.qBankRepository = qBankRepository;
    }

    public Exam createExam(
            ExamRequest request) {

        List<QBank> questions =
                qBankRepository.findAllById(
                        request.getQuestionIds());

        Exam exam =
                Exam.builder()
                        .examTitle(
                                request.getExamTitle())
                        .questions(questions)
                        .timeLimitMinutes(
                                request.getTimeLimitMinutes())
                        .totalMarks(
                                request.getTotalMarks())
                        .createdBy(
                                request.getCreatedBy())
                        .build();

        return examRepository.save(exam);
    }

    public List<Exam> getAllExams() {

        return examRepository.findAll();
    }

    public Exam getExamById(Long id) {

        return examRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Exam Not Found"));
    }
}