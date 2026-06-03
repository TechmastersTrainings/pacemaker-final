package com.marrow.example.repository;

import com.marrow.example.entity.UserPoints;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserPointsRepository extends JpaRepository<UserPoints, Long> {
    Optional<UserPoints> findByUserId(Long userId);
    List<UserPoints> findAllByOrderByTotalPointsDesc();
}
