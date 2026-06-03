package com.marrow.example.exception;

public class SSOException extends RuntimeException {
    public SSOException(String message) {
        super(message);
    }
    public SSOException(String message, Throwable cause) {
        super(message, cause);
    }
}
