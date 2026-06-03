package com.marrow.example.entity;

import com.marrow.example.enums.SessionStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_sessions", indexes = {
    @Index(name = "idx_us_jwt", columnList = "jwt_token"),
    @Index(name = "idx_us_status", columnList = "session_status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "jwt_token", nullable = false, length = 1000, unique = true)
    private String jwtToken;

    @Enumerated(EnumType.STRING)
    @Column(name = "session_status", nullable = false)
    private SessionStatus sessionStatus;

    @Column(name = "login_time", nullable = false)
    private LocalDateTime loginTime;

    @Column(name = "logout_time")
    private LocalDateTime logoutTime;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (loginTime == null) {
            loginTime = LocalDateTime.now();
        }
        if (sessionStatus == null) {
            sessionStatus = SessionStatus.ACTIVE;
        }
    }
}
