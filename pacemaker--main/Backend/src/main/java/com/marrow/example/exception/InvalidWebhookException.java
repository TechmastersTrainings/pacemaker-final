package com.marrow.example.exception;

public class InvalidWebhookException extends RuntimeException {
    public InvalidWebhookException(String message) {
        super(message);
    }
}
