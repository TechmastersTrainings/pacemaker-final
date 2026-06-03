package com.marrow.example.controller;

import com.marrow.example.entity.User;
import com.marrow.example.service.AdminUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminUserService adminUserService;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/users")
    public ResponseEntity<List<User>> getUsers() {
        return ResponseEntity.ok(adminUserService.getAllUsers());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/subscriptions/{id}/disable")
    public ResponseEntity<User> disableSubscription(@PathVariable Long id) {
        return ResponseEntity.ok(adminUserService.disableUser(id));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/user/{id}")
    public ResponseEntity<User> deleteUser(@PathVariable Long id) {
        return ResponseEntity.ok(adminUserService.disableUser(id));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/users/{id}/enable")
    public ResponseEntity<User> enableUser(@PathVariable Long id) {
        return ResponseEntity.ok(adminUserService.enableUser(id));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/users/{id}/disable")
    public ResponseEntity<User> disableUser(@PathVariable Long id) {
        return ResponseEntity.ok(adminUserService.disableUser(id));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/instructors")
    public ResponseEntity<List<User>> getInstructors() {
        return ResponseEntity.ok(adminUserService.getInstructors());
    }
}
