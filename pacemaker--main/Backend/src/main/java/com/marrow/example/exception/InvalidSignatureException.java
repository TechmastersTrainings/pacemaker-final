package com.marrow.example.exception;

public class InvalidSignatureException extends RuntimeException {
    public InvalidSignatureException(String message) {
        super(message);
    }
}
