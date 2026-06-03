package com.marrow.example.entity;

import com.marrow.example.enums.JobStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "scheduler_history", indexes = {
    @Index(name = "idx_execution_time", columnList = "execution_time")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SchedulerHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "job_name", nullable = false)
    private String jobName;

    @Column(name = "execution_time", nullable = false)
    private LocalDateTime executionTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "job_status", nullable = false)
    private JobStatus jobStatus;

    @Column(name = "records_processed", nullable = false)
    private Integer recordsProcessed;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;
}
