package com.marrow.example.service;

import com.marrow.example.dto.*;
import com.marrow.example.entity.User;
import com.marrow.example.entity.UserSession;
import com.marrow.example.exception.SSOException;
import com.marrow.example.exception.TokenValidationException;
import com.marrow.example.repository.UserRepository;
import com.marrow.example.util.JwtSSOUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class SSOService {

    private final UserRepository userRepository;
    private final DiscourseService discourseService;
    private final SessionService sessionService;
    private final JwtSSOUtil jwtSSOUtil;

    @Transactional
    public SSOResponseDto loginDiscourse(SSORequestDto ssoRequest, HttpServletRequest request) {
        String email = ssoRequest.getEmail();
        if (email == null || email.isBlank()) {
            throw new SSOException("Email is required for SSO login");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new SSOException("User not found with email: " + email));

        // Generate JWT Token
        String jwtToken = jwtSSOUtil.generateSSOToken(user);

        // Create Active Session
        UserSession session = sessionService.createSession(user, jwtToken);

        // Generate Discourse Redirect URL
        String ipAddress = request.getRemoteAddr();
        String redirectUrl = discourseService.generateRedirectUrl(user, ssoRequest.getSso(), ipAddress);

        return SSOResponseDto.builder()
                .redirectUrl(redirectUrl)
                .build();
    }

    public DiscourseUserDto validateSsoToken(SSORequestDto ssoRequest, HttpServletRequest request) {
        String token = ssoRequest.getToken();
        if (token == null || token.isBlank()) {
            throw new TokenValidationException("Token is required for validation");
        }

        boolean isValid = jwtSSOUtil.validateSSOToken(token);
        if (!isValid) {
            return DiscourseUserDto.builder()
                    .valid(false)
                    .build();
        }

        String email = jwtSSOUtil.extractEmail(token);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new SSOException("User not found with email: " + email));

        String username = user.getName() != null ? user.getName().replaceAll("\\s+", "").toLowerCase() : email.split("@")[0];

        discourseService.recordAuditAction(user, "SSO_TOKEN_VALIDATE", request.getRemoteAddr());

        return DiscourseUserDto.builder()
                .valid(true)
                .username(username)
                .email(user.getEmail())
                .role(user.getRole() != null ? user.getRole() : "STUDENT")
                .externalId(String.valueOf(user.getId()))
                .build();
    }

    @Transactional
    public LogoutResponseDto logoutSsoSession(String email, HttpServletRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new SSOException("User not found with email: " + email));

        sessionService.logoutSession(email);

        discourseService.recordAuditAction(user, "SSO_LOGOUT", request.getRemoteAddr());

        return LogoutResponseDto.builder()
                .message("SSO logout successful")
                .build();
    }

    public SessionDetailsDto getSessionDetails(String email) {
        return sessionService.getSessionDetails(email);
    }
}
