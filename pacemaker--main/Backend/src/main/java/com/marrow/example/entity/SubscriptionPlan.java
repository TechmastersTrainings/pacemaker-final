package com.marrow.example.entity;

import com.marrow.example.enums.SubscriptionType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "subscription_plans")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "plan_type", unique = true, nullable = false)
    private SubscriptionType planType;

    @Column(nullable = false)
    private Double price;

    @Column(name = "qbank_access", nullable = false)
    private Boolean qbankAccess;

    @Column(name = "video_access", nullable = false)
    private Boolean videoAccess;

    @Column(name = "live_class_access", nullable = false)
    private Boolean liveClassAccess;

    @Column(name = "ai_access", nullable = false)
    private Boolean aiAccess;

    private String description;
}
