package com.marrow.example.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.marrow.example.dto.CourseRequest;
import com.marrow.example.entity.Course;
import com.marrow.example.repository.CourseRepository;

@Service
public class CourseService {

    private final CourseRepository
            courseRepository;

    public CourseService(
            CourseRepository courseRepository) {

        this.courseRepository =
                courseRepository;
    }

    public Course createCourse(
            CourseRequest request) {

        Course course =
                Course.builder()
                        .courseName(
                                request.getCourseName())
                        .description(
                                request.getDescription())
                        .thumbnailUrl(
                                request.getThumbnailUrl())
                        .build();

        return courseRepository.save(course);
    }

    public List<Course> getAllCourses() {

        return courseRepository.findAll();
    }
}