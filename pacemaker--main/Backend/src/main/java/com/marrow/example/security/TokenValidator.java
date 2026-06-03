package com.marrow.example.security;

import com.marrow.example.entity.UserSession;
import com.marrow.example.enums.SessionStatus;
import com.marrow.example.exception.TokenValidationException;
import com.marrow.example.repository.UserSessionRepository;
import com.marrow.example.util.JwtUtil;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class TokenValidator {

    private final JwtUtil jwtUtil;
    private final UserSessionRepository userSessionRepository;

    public boolean validateToken(String token) {
        try {
            String email = jwtUtil.extractEmail(token);
            if (email == null) {
                log.warn("Invalid JWT token: email is null");
                return false;
            }

            // Check if token exists in UserSession and is ACTIVE
            UserSession session = userSessionRepository.findByJwtToken(token).orElse(null);
            if (session != null && session.getSessionStatus() != SessionStatus.ACTIVE) {
                log.warn("Token session is not ACTIVE: status is {}", session.getSessionStatus());
                return false;
            }

            return true;
        } catch (ExpiredJwtException e) {
            log.warn("JWT token is expired: {}", e.getMessage());
            // If expired, update session status if exists
            userSessionRepository.findByJwtToken(token).ifPresent(session -> {
                session.setSessionStatus(SessionStatus.EXPIRED);
                userSessionRepository.save(session);
            });
            throw new TokenValidationException("Token is expired", e);
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("JWT token validation error: {}", e.getMessage());
            throw new TokenValidationException("Invalid JWT token", e);
        }
    }
}
