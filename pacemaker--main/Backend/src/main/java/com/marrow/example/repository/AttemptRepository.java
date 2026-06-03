package com.marrow.example.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.marrow.example.entity.Attempt;

public interface AttemptRepository
        extends JpaRepository<Attempt, Long> {

    // FIND ATTEMPTS BY USER

    List<Attempt> findByUserId(
            Long userId);

    // LEADERBOARD QUERY

    @Query("""
        SELECT a.userId,
               SUM(a.score)

        FROM Attempt a

        WHERE a.submittedAt >= :startDate

        GROUP BY a.userId

        ORDER BY SUM(a.score) DESC
    """)

    List<Object[]> getLeaderboard(
            LocalDateTime startDate);
}