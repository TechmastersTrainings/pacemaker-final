package com.marrow.example.repository;

import com.marrow.example.entity.MockExam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MockExamRepository extends JpaRepository<MockExam, Long> {
    boolean existsByExamTitle(String examTitle);
    long countBy();
}
