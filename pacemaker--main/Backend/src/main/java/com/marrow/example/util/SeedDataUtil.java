package com.marrow.example.util;

import java.util.List;

public class SeedDataUtil {

    public static final List<String> MEDICAL_SUBJECTS = List.of(
            "Anatomy", "Physiology", "Pathology", "Pharmacology", "Surgery"
    );

    public static final String DEFAULT_PASSWORD = "Pacemaker@2024";

    private SeedDataUtil() {
        // Utility class, no instantiation
    }
}
