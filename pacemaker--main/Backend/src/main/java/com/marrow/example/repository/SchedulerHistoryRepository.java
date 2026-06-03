package com.marrow.example.repository;

import com.marrow.example.entity.SchedulerHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SchedulerHistoryRepository extends JpaRepository<SchedulerHistory, Long> {
    List<SchedulerHistory> findAllByOrderByExecutionTimeDesc();
}
