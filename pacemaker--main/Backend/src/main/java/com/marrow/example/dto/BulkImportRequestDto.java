package com.marrow.example.dto;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class BulkImportRequestDto {
    private MultipartFile file;
}
