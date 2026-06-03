package com.marrow.example.exception;

public class SlowQueryException extends RuntimeException {
    public SlowQueryException(String message) {
        super(message);
    }
}
