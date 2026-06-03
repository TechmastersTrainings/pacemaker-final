package com.marrow.example.util;

public class QueryAnalyzerUtil {

    private QueryAnalyzerUtil() {
    }

    public static String formatExecutionPlan(String rawPlan) {
        if (rawPlan == null) {
            return "UNKNOWN";
        }
        return rawPlan.trim();
    }
}
