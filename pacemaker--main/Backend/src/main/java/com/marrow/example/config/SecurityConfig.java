package com.marrow.example.config;

import java.util.Arrays;
import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.marrow.example.security.JwtAuthenticationFilter;
import com.marrow.example.security.CustomAccessDeniedHandler;
import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final CustomAccessDeniedHandler customAccessDeniedHandler;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Centralized CORS configuration for:
     *  - Next.js Frontend  → http://localhost:3000
     *  - Expo Web Dev      → http://localhost:8081
     *  - Android Emulator  → http://10.0.2.2:8080 (calls are made from device, origin is typically null/app)
     *  - Production domains (add here when deploying)
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        config.setAllowedOrigins(Arrays.asList(
            "http://localhost:3000",   // Next.js Frontend
            "http://localhost:8081",   // Expo Web
            "http://10.0.2.2:8080",    // Android Emulator reverse proxy
            "http://127.0.0.1:3000",
            "http://127.0.0.1:8081",
            "https://pacemaker-final.vercel.app",
            "https://pacemaker-finel1.vercel.app",
            "https://*.vercel.app"
        ));

        config.setAllowedMethods(Arrays.asList(
            "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"
        ));

        config.setAllowedHeaders(List.of("*"));

        // Expose Authorization header so interceptors can read refreshed tokens
        config.setExposedHeaders(Arrays.asList(
            "Authorization",
            "X-Refresh-Token",
            "Content-Disposition"
        ));

        config.setAllowCredentials(true);
        config.setMaxAge(3600L); // Pre-flight cache: 1 hour

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .exceptionHandling(ex -> ex
                .accessDeniedHandler(customAccessDeniedHandler)
            )
            .authorizeHttpRequests(auth -> auth
                // Public — Swagger / OpenAPI
                .requestMatchers(
                    "/v3/api-docs/**",
                    "/swagger-ui/**",
                    "/swagger-ui.html"
                ).permitAll()
                // Public — Authentication endpoints
                .requestMatchers(
                    "/api/v1/auth/**"
                ).permitAll()
                // Public — Payment & Webhooks (called by Razorpay servers)
                .requestMatchers(
                    "/api/v1/payments/**",
                    "/api/v1/webhooks/**",
                    "/api/v1/subscription-plans/**",
                    "/api/v1/subscriptions/verify",
                    "/api/v1/notifications/welcome",
                    "/api/v1/notifications/payment-confirmation",
                    "/api/v1/sso/discourse/login",
                    "/api/v1/sso/discourse/validate"
                ).permitAll()
                // Everything else requires a valid JWT
                .anyRequest().authenticated()
            )
            .formLogin(form -> form.disable())
            .httpBasic(httpBasic -> httpBasic.disable())
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}