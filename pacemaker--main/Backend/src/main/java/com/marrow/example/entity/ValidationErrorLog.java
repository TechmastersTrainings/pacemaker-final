package com.marrow.example.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "validation_error_log")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ValidationErrorLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "import_history_id", nullable = false)
    private ImportHistory importHistory;

    @Column(name = "record_number", nullable = false)
    private Integer recordNumber;

    @Column(name = "field_name", nullable = false)
    private String fieldName;

    @Column(name = "error_message", nullable = false, columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}
