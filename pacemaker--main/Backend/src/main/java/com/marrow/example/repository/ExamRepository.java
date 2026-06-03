package com.marrow.example.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.marrow.example.entity.Exam;

public interface ExamRepository
        extends JpaRepository<Exam, Long> {

}