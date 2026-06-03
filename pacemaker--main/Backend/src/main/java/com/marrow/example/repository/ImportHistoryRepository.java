package com.marrow.example.repository;

import com.marrow.example.entity.ImportHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ImportHistoryRepository extends JpaRepository<ImportHistory, Long> {
    List<ImportHistory> findAllByOrderByCreatedAtDesc();
}
