package com.marrow.example.repository;

import com.marrow.example.entity.Badge;
import com.marrow.example.enums.BadgeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface BadgeRepository extends JpaRepository<Badge, Long> {
    Optional<Badge> findByBadgeType(BadgeType badgeType);
}
