package com.marrow.example.repository;

import com.marrow.example.entity.StudentPerformance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentPerformanceRepository extends JpaRepository<StudentPerformance, Long> {
    List<StudentPerformance> findByUserId(Long userId);
    Optional<StudentPerformance> findByUserIdAndSubjectId(Long userId, Long subjectId);
}
