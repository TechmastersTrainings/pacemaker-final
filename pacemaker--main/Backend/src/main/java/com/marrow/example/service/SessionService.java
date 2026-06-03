package com.marrow.example.service;

import com.marrow.example.dto.SessionDetailsDto;
import com.marrow.example.entity.User;
import com.marrow.example.entity.UserSession;
import com.marrow.example.enums.SSOProvider;
import com.marrow.example.enums.SessionStatus;
import com.marrow.example.exception.SSOException;
import com.marrow.example.repository.UserRepository;
import com.marrow.example.repository.UserSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class SessionService {

    private final UserSessionRepository userSessionRepository;
    private final UserRepository userRepository;

    @Transactional
    public UserSession createSession(User user, String jwtToken) {
        // Invalidate previous active sessions if any
        var activeSessions = userSessionRepository.findByUserIdAndSessionStatus(user.getId(), SessionStatus.ACTIVE);
        for (var s : activeSessions) {
            s.setSessionStatus(SessionStatus.EXPIRED);
            s.setLogoutTime(LocalDateTime.now());
        }
        userSessionRepository.saveAll(activeSessions);

        UserSession newSession = UserSession.builder()
                .user(user)
                .jwtToken(jwtToken)
                .sessionStatus(SessionStatus.ACTIVE)
                .loginTime(LocalDateTime.now())
                .createdAt(LocalDateTime.now())
                .build();
        return userSessionRepository.save(newSession);
    }

    @Transactional
    public void logoutSession(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new SSOException("User not found with email: " + email));

        var activeSessions = userSessionRepository.findByUserIdAndSessionStatus(user.getId(), SessionStatus.ACTIVE);
        for (var s : activeSessions) {
            s.setSessionStatus(SessionStatus.LOGGED_OUT);
            s.setLogoutTime(LocalDateTime.now());
        }
        userSessionRepository.saveAll(activeSessions);
        log.info("Successfully logged out all SSO sessions for user: {}", email);
    }

    public SessionDetailsDto getSessionDetails(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new SSOException("User not found with email: " + email));

        var activeSessions = userSessionRepository.findByUserIdAndSessionStatus(user.getId(), SessionStatus.ACTIVE);
        String status = activeSessions.isEmpty() ? SessionStatus.LOGGED_OUT.name() : SessionStatus.ACTIVE.name();

        return SessionDetailsDto.builder()
                .provider(SSOProvider.DISCOURSE.name())
                .status(status)
                .build();
    }
}
