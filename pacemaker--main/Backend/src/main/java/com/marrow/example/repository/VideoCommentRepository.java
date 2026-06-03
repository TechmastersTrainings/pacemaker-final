package com.marrow.example.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.marrow.example.entity.VideoComment;

public interface VideoCommentRepository
        extends JpaRepository<VideoComment, Long> {

    List<VideoComment>
    findByVideoId(Long videoId);
}