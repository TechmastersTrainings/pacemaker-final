package com.marrow.example.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.marrow.example.entity.CommunityForum;

public interface CommunityForumRepository
        extends JpaRepository<CommunityForum, Long> {

}