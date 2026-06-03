package com.marrow.example.repository;

import com.marrow.example.entity.QuestionAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionAttemptRepository extends JpaRepository<QuestionAttempt, Long> {
    List<QuestionAttempt> findByUserId(Long userId);
    long countByUserId(Long userId);
}
