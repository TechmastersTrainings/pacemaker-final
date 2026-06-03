package com.marrow.example.util;

import com.marrow.example.entity.User;
import com.marrow.example.security.TokenValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class JwtSSOUtil {

    private final JwtUtil jwtUtil;
    private final TokenValidator tokenValidator;

    public String generateSSOToken(User user) {
        return jwtUtil.generateToken(user.getEmail(), user.getRole());
    }

    public boolean validateSSOToken(String token) {
        return tokenValidator.validateToken(token);
    }

    public String extractEmail(String token) {
        return jwtUtil.extractEmail(token);
    }
}
