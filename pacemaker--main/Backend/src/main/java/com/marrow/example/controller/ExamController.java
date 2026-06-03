package com.marrow.example.controller;

import java.util.List;

import org.springframework.web.bind.annotation.*;

import com.marrow.example.dto.ExamRequest;
import com.marrow.example.entity.Exam;
import com.marrow.example.service.ExamService;

@RestController
@RequestMapping("/api/v1/exams")

public class ExamController {

    private final ExamService examService;

    public ExamController(
            ExamService examService) {

        this.examService = examService;
    }

    @PostMapping

    public Exam createExam(
            @RequestBody
            ExamRequest request) {

        return examService.createExam(request);
    }

    @GetMapping

    public List<Exam> getAllExams() {

        return examService.getAllExams();
    }

    @GetMapping("/{id}")

    public Exam getExamById(
            @PathVariable Long id) {

        return examService.getExamById(id);
    }
}