package com.marrow.example.controller;

import com.marrow.example.dto.SubscriptionStatusDto;
import com.marrow.example.dto.UserSubscriptionDto;
import com.marrow.example.service.SubscriptionManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/subscriptions")
@RequiredArgsConstructor
public class SubscriptionManagementController {

    private final SubscriptionManagementService subscriptionService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserSubscriptionDto>> getAllSubscriptions() {
        return ResponseEntity.ok(subscriptionService.getAllSubscriptions());
    }

    @PutMapping("/{subscriptionId}/disable")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SubscriptionStatusDto> disableSubscription(@PathVariable Long subscriptionId) {
        return ResponseEntity.ok(subscriptionService.disableSubscription(subscriptionId));
    }

    @PutMapping("/{subscriptionId}/enable")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SubscriptionStatusDto> enableSubscription(@PathVariable Long subscriptionId) {
        return ResponseEntity.ok(subscriptionService.enableSubscription(subscriptionId));
    }
}
