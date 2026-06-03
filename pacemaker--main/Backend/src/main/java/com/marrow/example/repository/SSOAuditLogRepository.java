package com.marrow.example.repository;

import com.marrow.example.entity.SSOAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SSOAuditLogRepository extends JpaRepository<SSOAuditLog, Long> {
    List<SSOAuditLog> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<SSOAuditLog> findAllByOrderByCreatedAtDesc();
}
