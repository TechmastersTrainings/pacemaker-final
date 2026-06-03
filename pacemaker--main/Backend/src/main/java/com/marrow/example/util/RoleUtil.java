package com.marrow.example.util;

public class RoleUtil {
    public static String formatRole(String role) {
        if (role == null) return "ROLE_STUDENT";
        return role.startsWith("ROLE_") ? role.toUpperCase() : "ROLE_" + role.toUpperCase();
    }
}
