package com.marrow.example.service;

import java.io.IOException;
import java.nio.file.*;
import java.util.List;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.marrow.example.dto.StudyMaterialResponse;
import com.marrow.example.entity.StudyMaterial;
import com.marrow.example.repository.StudyMaterialRepository;
import com.marrow.example.exception.ResourceNotFoundException;

@Service
public class StudyMaterialService {

    private final StudyMaterialRepository
            studyMaterialRepository;

    private final Path uploadPath =
            Paths.get("uploads");

    public StudyMaterialService(
            StudyMaterialRepository
                    studyMaterialRepository)
            throws IOException {

        this.studyMaterialRepository =
                studyMaterialRepository;

        Files.createDirectories(uploadPath);
    }

    // UPLOAD PDF

    public StudyMaterialResponse uploadFile(

            String subjectName,
            String chapterName,
            MultipartFile file)

            throws IOException {

        String fileName =
                System.currentTimeMillis()
                        + "_"
                        + file.getOriginalFilename();

        Path filePath =
                uploadPath.resolve(fileName);

        Files.copy(
                file.getInputStream(),
                filePath,
                StandardCopyOption.REPLACE_EXISTING);

        StudyMaterial material =
                StudyMaterial.builder()
                        .subjectName(subjectName)
                        .chapterName(chapterName)
                        .fileName(fileName)
                        .fileType(
                                file.getContentType())
                        .filePath(
                                filePath.toString())
                        .fileSize(file.getSize())
                        .build();

        StudyMaterial saved =
                studyMaterialRepository
                        .save(material);

        return StudyMaterialResponse
                .builder()
                .id(saved.getId())
                .subjectName(
                        saved.getSubjectName())
                .chapterName(
                        saved.getChapterName())
                .fileName(
                        saved.getFileName())
                .downloadUrl(
                        "/api/study-materials/download/"
                                + saved.getId())
                .build();
    }

    // DOWNLOAD FILE

    public Resource downloadFile(Long id)
            throws IOException {

        StudyMaterial material =
                studyMaterialRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "File Not Found"));

        Path path =
                Paths.get(
                        material.getFilePath());

        return new UrlResource(
                path.toUri());
    }

    // GET ALL FILES

    public List<StudyMaterial>
    getAllMaterials() {

        return studyMaterialRepository
                .findAll();
    }

    public void deleteMaterial(Long id) throws IOException {
        StudyMaterial material = studyMaterialRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("File Not Found"));
        Path path = Paths.get(material.getFilePath());
        Files.deleteIfExists(path);
        studyMaterialRepository.deleteById(id);
    }
}