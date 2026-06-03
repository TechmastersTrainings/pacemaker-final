package com.marrow.example.service;

import com.marrow.example.entity.SSOAuditLog;
import com.marrow.example.entity.User;
import com.marrow.example.enums.SSOProvider;
import com.marrow.example.repository.SSOAuditLogRepository;
import com.marrow.example.util.DiscoursePayloadUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class DiscourseService {

    private final DiscoursePayloadUtil discoursePayloadUtil;
    private final SSOAuditLogRepository ssoAuditLogRepository;

    @Transactional
    public String generateRedirectUrl(User user, String sso, String ipAddress) {
        String nonce = null;
        if (sso != null && !sso.isBlank()) {
            nonce = discoursePayloadUtil.extractNonce(sso);
        }

        String redirectUrl = discoursePayloadUtil.generateSsoPayload(user, nonce);

        // Record Audit Log
        SSOAuditLog auditLog = SSOAuditLog.builder()
                .user(user)
                .provider(SSOProvider.DISCOURSE)
                .action("SSO_LOGIN_REDIRECT")
                .ipAddress(ipAddress != null ? ipAddress : "127.0.0.1")
                .createdAt(LocalDateTime.now())
                .build();
        ssoAuditLogRepository.save(auditLog);

        log.info("Generated Discourse SSO redirect URL for user: {}", user.getEmail());
        return redirectUrl;
    }

    @Transactional
    public void recordAuditAction(User user, String action, String ipAddress) {
        SSOAuditLog auditLog = SSOAuditLog.builder()
                .user(user)
                .provider(SSOProvider.DISCOURSE)
                .action(action)
                .ipAddress(ipAddress != null ? ipAddress : "127.0.0.1")
                .createdAt(LocalDateTime.now())
                .build();
        ssoAuditLogRepository.save(auditLog);
    }
}
