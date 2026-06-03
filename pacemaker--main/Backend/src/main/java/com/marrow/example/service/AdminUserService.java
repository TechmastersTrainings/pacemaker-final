package com.marrow.example.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.marrow.example.dto.UserRoleUpdateRequest;
import com.marrow.example.entity.User;
import com.marrow.example.exception.ResourceNotFoundException;
import com.marrow.example.repository.UserRepository;

@Service
public class AdminUserService {

    private final UserRepository
            userRepository;

    public AdminUserService(
            UserRepository userRepository) {

        this.userRepository =
                userRepository;
    }

    // LIST ALL USERS

    public List<User> getAllUsers() {

        return userRepository.findAll();
    }

    // LIST ALL INSTRUCTORS
    public List<User> getInstructors() {
        return userRepository.findAll().stream()
                .filter(u -> "INSTRUCTOR".equalsIgnoreCase(u.getRole()))
                .toList();
    }

    // CHANGE USER ROLE

    public User updateUserRole(

            Long userId,

            UserRoleUpdateRequest request) {

        User user =
                userRepository.findById(userId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "User Not Found"));

        user.setRole(request.getRole());

        return userRepository.save(user);
    }

    // DISABLE USER

    public User disableUser(Long userId) {

        User user =
                userRepository.findById(userId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "User Not Found"));

        user.setEnabled(false);

        return userRepository.save(user);
    }

    // ENABLE USER

    public User enableUser(Long userId) {

        User user =
                userRepository.findById(userId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "User Not Found"));

        user.setEnabled(true);

        return userRepository.save(user);
    }
}