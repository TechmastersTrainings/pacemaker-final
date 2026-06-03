package com.marrow.example.exception;

public class VideoAccessDeniedException extends RuntimeException {
    public VideoAccessDeniedException(String message) {
        super(message);
    }
}
