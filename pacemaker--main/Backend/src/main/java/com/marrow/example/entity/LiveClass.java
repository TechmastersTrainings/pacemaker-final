package com.marrow.example.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "live_classes")

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder

public class LiveClass {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private LocalDateTime classDateTime;

    @Column(nullable = false, length = 1000)
    private String zoomJoinUrl;

    private String zoomMeetingId;

    @Column(name = "trainer_name")
    private String trainerName;

    @Column(name = "topic")
    private String topic;

    @Column(columnDefinition = "TEXT")
    private String description;
}