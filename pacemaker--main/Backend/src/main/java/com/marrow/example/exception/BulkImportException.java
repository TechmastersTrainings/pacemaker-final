package com.marrow.example.exception;

public class BulkImportException extends RuntimeException {
    public BulkImportException(String message) {
        super(message);
    }
    public BulkImportException(String message, Throwable cause) {
        super(message, cause);
    }
}
