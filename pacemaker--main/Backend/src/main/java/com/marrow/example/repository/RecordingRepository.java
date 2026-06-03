package com.marrow.example.repository;

import com.marrow.example.entity.Recording;
import com.marrow.example.enums.RecordingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RecordingRepository extends JpaRepository<Recording, Long> {
    Optional<Recording> findByRecordingId(String recordingId);
    List<Recording> findByRecordingStatus(RecordingStatus status);
    boolean existsByRecordingId(String recordingId);
}
