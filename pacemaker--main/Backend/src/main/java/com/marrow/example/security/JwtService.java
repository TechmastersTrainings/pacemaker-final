package com.marrow.example.security;

import com.marrow.example.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class JwtService {
    private final JwtUtil jwtUtil;

    public String generateToken(String email, String role) {
        return jwtUtil.generateToken(email, role);
    }
}
