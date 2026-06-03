package com.marrow.example.repository;

import com.marrow.example.entity.VideoWatchHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VideoWatchHistoryRepository extends JpaRepository<VideoWatchHistory, Long> {
    Optional<VideoWatchHistory> findByUserIdAndVideoId(Long userId, Long videoId);
    List<VideoWatchHistory> findByUserIdOrderByLastWatchedTimeDesc(Long userId);
}
