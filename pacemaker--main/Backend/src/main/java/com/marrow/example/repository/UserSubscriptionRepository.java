package com.marrow.example.repository;

import com.marrow.example.entity.UserSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface UserSubscriptionRepository extends JpaRepository<UserSubscription, Long> {
    Optional<UserSubscription> findBySubscriptionId(String subscriptionId);
    List<UserSubscription> findByUserId(Long userId);
    Optional<UserSubscription> findTopByUserIdOrderByCreatedAtDesc(Long userId);
}
