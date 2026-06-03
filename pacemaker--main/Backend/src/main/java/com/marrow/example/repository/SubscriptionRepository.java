package com.marrow.example.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.marrow.example.entity.Subscription;

public interface SubscriptionRepository
        extends JpaRepository<Subscription, Long> {

    Optional<Subscription>
    findByUserId(Long userId);
}