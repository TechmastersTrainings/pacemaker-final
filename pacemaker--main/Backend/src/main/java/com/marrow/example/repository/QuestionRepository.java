package com.marrow.example.repository;

import com.marrow.example.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long>, JpaSpecificationExecutor<Question> {

    @Query("SELECT q FROM Question q LEFT JOIN q.subject s LEFT JOIN q.tags t WHERE " +
           "LOWER(q.questionText) LIKE LOWER(CONCAT('%', :kw, '%')) " +
           "OR LOWER(q.topic) LIKE LOWER(CONCAT('%', :kw, '%')) " +
           "OR LOWER(s.subjectName) LIKE LOWER(CONCAT('%', :kw, '%')) " +
           "OR LOWER(t.tagName) LIKE LOWER(CONCAT('%', :kw, '%'))")
    Page<Question> searchQuestions(@Param("kw") String kw, Pageable pageable);

    boolean existsByQuestionText(String questionText);

    @Query(value = """
    SELECT q
    FROM Question q
    JOIN FETCH q.subject
    WHERE q.difficulty = :difficulty
    """, countQuery = "SELECT count(q) FROM Question q WHERE q.difficulty = :difficulty")
    Page<Question> findByDifficulty(@Param("difficulty") com.marrow.example.enums.DifficultyLevel difficulty, Pageable pageable);
}
