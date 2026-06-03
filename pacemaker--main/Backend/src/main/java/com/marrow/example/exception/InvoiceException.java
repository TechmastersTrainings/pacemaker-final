package com.marrow.example.exception;

public class InvoiceException extends RuntimeException {
    public InvoiceException(String message, Throwable cause) {
        super(message, cause);
    }
    public InvoiceException(String message) {
        super(message);
    }
}
