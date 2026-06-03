package com.marrow.example.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "search_history", indexes = {
    @Index(name = "idx_sh_user", columnList = "user_id"),
    @Index(name = "idx_sh_keyword", columnList = "keyword")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SearchHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String keyword;

    @Column(name = "search_time", nullable = false)
    private LocalDateTime searchTime;

    @PrePersist
    public void prePersist() {
        this.searchTime = LocalDateTime.now();
    }
}
