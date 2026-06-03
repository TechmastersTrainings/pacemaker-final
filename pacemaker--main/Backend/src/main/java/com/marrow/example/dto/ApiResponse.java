package com.marrow.example.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Unified API response wrapper used across all controllers.
 *
 * <p>All endpoints should return this type so that front-end / mobile
 * clients can rely on a consistent shape:
 * <pre>
 * {
 *   "success": true | false,
 *   "message": "Human-readable status message",
 *   "data":    { ... } | null       // Omitted when null
 * }
 * </pre>
 *
 * @param <T> Payload type
 */
@Getter
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private boolean success;
    private String  message;
    private T       data;

    // ── Constructors ─────────────────────────────────────────────────────────

    private ApiResponse(boolean success, String message, T data) {
        this.success = success;
        this.message = message;
        this.data    = data;
    }

    // ── Static factory helpers ───────────────────────────────────────────────

    /** 200 OK with payload */
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, "Success", data);
    }

    /** 200 OK with custom message and payload */
    public static <T> ApiResponse<T> success(String message, T data) {
        return new ApiResponse<>(true, message, data);
    }

    /** 200 OK – message only (e.g. "User Registered Successfully") */
    public static <T> ApiResponse<T> success(String message) {
        return new ApiResponse<>(true, message, null);
    }

    /** 4xx / 5xx – failure with message only */
    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<>(false, message, null);
    }

    /** 4xx / 5xx – failure with message and optional debug payload */
    public static <T> ApiResponse<T> error(String message, T data) {
        return new ApiResponse<>(false, message, data);
    }
}
