package com.marrow.example.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.marrow.example.entity.Course;

public interface CourseRepository
        extends JpaRepository<Course, Long> {

}