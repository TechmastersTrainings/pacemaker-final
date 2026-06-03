package com.marrow.example.repository;

import com.marrow.example.entity.ValidationErrorLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ValidationErrorRepository extends JpaRepository<ValidationErrorLog, Long> {
    List<ValidationErrorLog> findByImportHistoryId(Long importHistoryId);
}
