package com.marrow.example.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "discourse")
@Getter
@Setter
public class DiscourseConfig {
    private String baseUrl;
    private String ssoSecret;
}
