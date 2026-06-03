package com.marrow.example.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "study_materials")

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder

public class StudyMaterial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String subjectName;

    private String chapterName;

    private String fileName;

    private String fileType;

    private String filePath;

    private Long fileSize;

    private LocalDateTime uploadedAt;

    @PrePersist
    public void prePersist() {

        uploadedAt = LocalDateTime.now();
    }
}