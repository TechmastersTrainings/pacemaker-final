package com.marrow.example.repository;

import com.marrow.example.entity.UserSession;
import com.marrow.example.enums.SessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserSessionRepository extends JpaRepository<UserSession, Long> {
    Optional<UserSession> findByJwtToken(String jwtToken);
    List<UserSession> findByUserIdAndSessionStatus(Long userId, SessionStatus status);
    List<UserSession> findBySessionStatus(SessionStatus status);
}
