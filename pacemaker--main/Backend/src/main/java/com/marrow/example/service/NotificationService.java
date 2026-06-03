package com.marrow.example.service;

import com.marrow.example.dto.EmailResponseDto;
import com.marrow.example.dto.NotificationHistoryResponseDto;
import com.marrow.example.dto.PaymentConfirmationDto;
import com.marrow.example.dto.WelcomeEmailDto;
import com.marrow.example.entity.NotificationHistory;
import com.marrow.example.entity.User;
import com.marrow.example.enums.NotificationStatus;
import com.marrow.example.enums.NotificationType;
import com.marrow.example.exception.ResourceNotFoundException;
import com.marrow.example.repository.NotificationHistoryRepository;
import com.marrow.example.repository.UserRepository;
import com.marrow.example.util.EmailTemplateUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final EmailService emailService;
    private final NotificationHistoryRepository historyRepository;
    private final UserRepository userRepository;

    @Transactional
    public EmailResponseDto sendWelcomeEmail(WelcomeEmailDto requestDto) {
        User user = userRepository.findByEmail(requestDto.getEmail())
                .orElse(null); // Welcome email might be triggered externally before auth context is bound

        String subject = "Welcome to PaceMaker";
        String message = EmailTemplateUtil.getWelcomeEmailTemplate(requestDto.getName());

        NotificationHistory history = NotificationHistory.builder()
                .user(user != null ? user : userRepository.findAll().stream().findFirst().orElse(null)) // Fallback if dummy registration
                .email(requestDto.getEmail())
                .subject(subject)
                .message(message)
                .notificationType(NotificationType.WELCOME)
                .notificationStatus(NotificationStatus.PENDING)
                .build();

        history = historyRepository.save(history);

        try {
            emailService.sendEmailAsync(requestDto.getEmail(), subject, message);
            history.setNotificationStatus(NotificationStatus.SENT);
            history.setSentAt(LocalDateTime.now());
        } catch (Exception e) {
            history.setNotificationStatus(NotificationStatus.FAILED);
            log.error("Welcome email failed for {}", requestDto.getEmail());
        }

        historyRepository.save(history);

        return EmailResponseDto.builder()
                .message("Welcome email sent successfully")
                .build();
    }

    @Transactional
    public EmailResponseDto sendPaymentConfirmation(PaymentConfirmationDto requestDto) {
        User user = userRepository.findByEmail(requestDto.getEmail()).orElse(null);

        String subject = "Payment Confirmation & Subscription Activation";
        String message = EmailTemplateUtil.getPaymentConfirmationTemplate(requestDto.getAmount(), requestDto.getPlan());

        NotificationHistory history = NotificationHistory.builder()
                .user(user != null ? user : userRepository.findAll().stream().findFirst().orElse(null))
                .email(requestDto.getEmail())
                .subject(subject)
                .message(message)
                .notificationType(NotificationType.PAYMENT_CONFIRMATION)
                .notificationStatus(NotificationStatus.PENDING)
                .build();

        history = historyRepository.save(history);

        try {
            emailService.sendEmailAsync(requestDto.getEmail(), subject, message);
            history.setNotificationStatus(NotificationStatus.SENT);
            history.setSentAt(LocalDateTime.now());
            
            // Trigger activation message as well
            String actMessage = EmailTemplateUtil.getSubscriptionActivationTemplate(requestDto.getPlan());
            emailService.sendEmailAsync(requestDto.getEmail(), "Subscription Activated", actMessage);
        } catch (Exception e) {
            history.setNotificationStatus(NotificationStatus.FAILED);
            log.error("Payment confirmation email failed for {}", requestDto.getEmail());
        }

        historyRepository.save(history);

        return EmailResponseDto.builder()
                .message("Payment confirmation email sent successfully")
                .build();
    }

    public List<NotificationHistoryResponseDto> getNotificationHistory() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return historyRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(h -> NotificationHistoryResponseDto.builder()
                        .subject(h.getSubject())
                        .status(h.getNotificationStatus().name())
                        .sentAt(h.getSentAt())
                        .build())
                .collect(Collectors.toList());
    }
}
