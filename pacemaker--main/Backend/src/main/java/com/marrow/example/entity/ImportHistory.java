package com.marrow.example.entity;

import com.marrow.example.enums.ImportStatus;
import com.marrow.example.enums.ImportType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "import_history", indexes = {
    @Index(name = "idx_imp_user", columnList = "uploaded_by"),
    @Index(name = "idx_imp_status", columnList = "import_status")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ImportHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Enumerated(EnumType.STRING)
    @Column(name = "import_type", nullable = false)
    private ImportType importType;

    @Column(name = "total_records", nullable = false)
    private Integer totalRecords;

    @Column(name = "successful_records", nullable = false)
    private Integer successfulRecords;

    @Column(name = "failed_records", nullable = false)
    private Integer failedRecords;

    @Enumerated(EnumType.STRING)
    @Column(name = "import_status", nullable = false)
    private ImportStatus importStatus;

    @Column(name = "uploaded_by", nullable = false)
    private String uploadedBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "importHistory", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ValidationErrorLog> validationErrorLogs = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}
