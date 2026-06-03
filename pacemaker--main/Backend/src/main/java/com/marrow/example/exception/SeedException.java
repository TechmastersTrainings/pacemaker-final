package com.marrow.example.exception;

public class SeedException extends RuntimeException {
    public SeedException(String message) {
        super(message);
    }
    public SeedException(String message, Throwable cause) {
        super(message, cause);
    }
}
