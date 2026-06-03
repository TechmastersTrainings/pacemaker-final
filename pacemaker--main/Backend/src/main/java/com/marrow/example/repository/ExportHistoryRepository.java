package com.marrow.example.repository;

import com.marrow.example.entity.ExportHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ExportHistoryRepository extends JpaRepository<ExportHistory, Long> {
}
