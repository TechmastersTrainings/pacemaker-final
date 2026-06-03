package com.marrow.example.controller;

import java.util.List;

import org.springframework.web.bind.annotation.*;

import com.marrow.example.dto.UserRoleUpdateRequest;
import com.marrow.example.entity.User;
import com.marrow.example.service.AdminUserService;

@RestController
@RequestMapping("/api/v1/admin/users")

public class AdminUserController {

    private final AdminUserService
            adminUserService;

    public AdminUserController(
            AdminUserService
                    adminUserService) {

        this.adminUserService =
                adminUserService;
    }

    // LIST USERS

    @GetMapping

    public List<User> getAllUsers() {

        return adminUserService
                .getAllUsers();
    }

    // CHANGE ROLE

    @PutMapping("/{userId}/role")

    public User updateRole(

            @PathVariable Long userId,

            @RequestBody
            UserRoleUpdateRequest request) {

        return adminUserService
                .updateUserRole(
                        userId,
                        request);
    }

    // DISABLE USER

    @PutMapping("/{userId}/disable")

    public User disableUser(
            @PathVariable Long userId) {

        return adminUserService
                .disableUser(userId);
    }

    // ENABLE USER

    @PutMapping("/{userId}/enable")

    public User enableUser(
            @PathVariable Long userId) {

        return adminUserService
                .enableUser(userId);
    }
}