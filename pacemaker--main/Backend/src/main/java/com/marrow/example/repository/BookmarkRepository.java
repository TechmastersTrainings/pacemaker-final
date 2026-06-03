package com.marrow.example.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.marrow.example.entity.Bookmark;

public interface BookmarkRepository
        extends JpaRepository<Bookmark, Long> {

    List<Bookmark> findByUserId(
            Long userId);
}