package com.marrow.example.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.marrow.example.entity.LiveClass;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LiveClassRepository extends JpaRepository<LiveClass, Long> {

    @Query("SELECT l FROM LiveClass l WHERE LOWER(l.title) LIKE LOWER(CONCAT('%', :kw, '%')) " +
           "OR LOWER(l.trainerName) LIKE LOWER(CONCAT('%', :kw, '%')) " +
           "OR LOWER(l.topic) LIKE LOWER(CONCAT('%', :kw, '%'))")
    Page<LiveClass> searchLiveClasses(@Param("kw") String kw, Pageable pageable);

    boolean existsByTitle(String title);
}