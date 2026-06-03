package com.marrow.example.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "subscriptions")

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder

public class Subscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;

    @Column(nullable = false)
    private String planName;

    @Column(nullable = false)
    private String subscriptionStatus;

    private LocalDateTime startDate;

    private LocalDateTime expiryDate;

    @PrePersist
    public void prePersist() {

        startDate = LocalDateTime.now();

        expiryDate = startDate.plusMonths(1);
    }
}