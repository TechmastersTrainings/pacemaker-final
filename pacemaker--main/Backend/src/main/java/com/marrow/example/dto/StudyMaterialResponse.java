package com.marrow.example.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder

public class StudyMaterialResponse {

    private Long id;

    private String subjectName;

    private String chapterName;

    private String fileName;

    private String downloadUrl;
}