package com.marrow.example.config;

import org.springframework.context.annotation.Configuration;

@Configuration
public class FileUploadConfig {
    public static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
}
