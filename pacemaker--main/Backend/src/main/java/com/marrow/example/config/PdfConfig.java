package com.marrow.example.config;

import org.springframework.context.annotation.Configuration;
import java.io.File;

@Configuration
public class PdfConfig {
    public static final String STORAGE_DIRECTORY = "invoices_pdf";

    public PdfConfig() {
        File directory = new File(STORAGE_DIRECTORY);
        if (!directory.exists()) {
            directory.mkdirs();
        }
    }
}
