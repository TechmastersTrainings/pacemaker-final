package com.marrow.example.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.marrow.example.entity.User;

public interface UserRepository
        extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    long countByRole(String role);

    org.springframework.data.domain.Page<User> findByRole(String role, org.springframework.data.domain.Pageable pageable);
}