package com.marrow.example.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.marrow.example.entity.Enrollment;

public interface EnrollmentRepository
        extends JpaRepository<Enrollment, Long> {

    List<Enrollment> findByStudentId(
            Long studentId);
}