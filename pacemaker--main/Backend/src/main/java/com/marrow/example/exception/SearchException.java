package com.marrow.example.exception;

public class SearchException extends RuntimeException {
    public SearchException(String message, Throwable cause) {
        super(message, cause);
    }
}
