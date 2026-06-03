package com.marrow.example.controller;

import java.io.IOException;
import java.util.List;

import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.marrow.example.dto.ApiResponse;
import com.marrow.example.dto.StudyMaterialResponse;
import com.marrow.example.entity.StudyMaterial;
import com.marrow.example.service.StudyMaterialService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/study-materials")
@RequiredArgsConstructor
public class StudyMaterialController {

    private final StudyMaterialService studyMaterialService;

    // UPLOAD PDF
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<StudyMaterialResponse>> uploadFile(
            @RequestParam String subjectName,
            @RequestParam String chapterName,
            @RequestParam("file") MultipartFile file) throws IOException {

        StudyMaterialResponse response = studyMaterialService.uploadFile(subjectName, chapterName, file);
        return ResponseEntity.ok(ApiResponse.success("File uploaded successfully", response));
    }

    // DOWNLOAD PDF
    @GetMapping("/download/{id}")
    public ResponseEntity<Resource> downloadFile(@PathVariable Long id) throws IOException {
        Resource resource = studyMaterialService.downloadFile(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }

    // GET ALL MATERIALS
    @GetMapping
    public ResponseEntity<ApiResponse<List<StudyMaterial>>> getAllMaterials() {
        List<StudyMaterial> materials = studyMaterialService.getAllMaterials();
        return ResponseEntity.ok(ApiResponse.success(materials));
    }

    // DELETE MATERIAL
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteMaterial(@PathVariable Long id) throws IOException {
        studyMaterialService.deleteMaterial(id);
        return ResponseEntity.ok(ApiResponse.success("File deleted successfully", "Deleted"));
    }
}