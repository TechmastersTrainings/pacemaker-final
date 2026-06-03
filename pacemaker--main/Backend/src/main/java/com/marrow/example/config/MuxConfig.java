package com.marrow.example.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MuxConfig {

    @Value("${mux.token.id}")
    private String tokenId;

    @Value("${mux.token.secret}")
    private String tokenSecret;

    public String getTokenId() {
        return tokenId;
    }

    public String getTokenSecret() {
        return tokenSecret;
    }
}