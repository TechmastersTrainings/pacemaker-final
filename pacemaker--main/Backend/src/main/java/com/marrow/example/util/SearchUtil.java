package com.marrow.example.util;

public class SearchUtil {

    public static String cleanKeyword(String kw) {
        if (kw == null || kw.trim().isEmpty()) {
            return "";
        }
        return kw.trim().toLowerCase();
    }
}
