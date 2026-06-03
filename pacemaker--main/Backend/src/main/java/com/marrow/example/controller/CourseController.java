package com.marrow.example.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.marrow.example.dto.ApiResponse;
import com.marrow.example.dto.CourseRequest;
import com.marrow.example.entity.Course;
import com.marrow.example.service.CourseService;

import lombok.RequiredArgsConstructor;

/**
 * Course Management Endpoints.
 */
@RestController
@RequestMapping("/api/v1/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;

    /**
     * Create a new course (Admin/Instructor only).
     */
    @PostMapping
    public ResponseEntity<ApiResponse<Course>> createCourse(
            @RequestBody CourseRequest request) {
        Course course = courseService.createCourse(request);
        return ResponseEntity.ok(ApiResponse.success("Course created successfully", course));
    }

    /**
     * Get all courses.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<Course>>> getAllCourses() {
        List<Course> courses = courseService.getAllCourses();
        return ResponseEntity.ok(ApiResponse.success(courses));
    }
}