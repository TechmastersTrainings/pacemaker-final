package com.marrow.example.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.marrow.example.entity.LiveRecording;

public interface LiveRecordingRepository
        extends JpaRepository<LiveRecording, Long> {

}