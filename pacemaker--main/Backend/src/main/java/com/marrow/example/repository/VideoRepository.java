package com.marrow.example.repository;

import com.marrow.example.entity.Video;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface VideoRepository extends JpaRepository<Video, Long> {

    @Query("SELECT v FROM Video v WHERE LOWER(v.title) LIKE LOWER(CONCAT('%', :kw, '%')) " +
           "OR LOWER(v.description) LIKE LOWER(CONCAT('%', :kw, '%')) " +
           "OR LOWER(v.tags) LIKE LOWER(CONCAT('%', :kw, '%'))")
    Page<Video> searchVideos(@Param("kw") String kw, Pageable pageable);

    boolean existsByTitleOrVideoUrl(String title, String videoUrl);
}