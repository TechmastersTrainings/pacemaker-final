package com.marrow.example.service;

import com.marrow.example.config.PdfConfig;
import com.marrow.example.dto.InvoiceRequestDto;
import com.marrow.example.dto.InvoiceResponseDto;
import com.marrow.example.entity.Invoice;
import com.marrow.example.entity.PaymentOrder;
import com.marrow.example.entity.User;
import com.marrow.example.enums.InvoiceStatus;
import com.marrow.example.exception.InvoiceException;
import com.marrow.example.exception.ResourceNotFoundException;
import com.marrow.example.repository.InvoiceRepository;
import com.marrow.example.repository.PaymentOrderRepository;
import com.marrow.example.repository.UserRepository;
import com.marrow.example.util.InvoicePdfUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final PaymentOrderRepository paymentOrderRepository;
    private final UserRepository userRepository;

    @Transactional
    public InvoiceResponseDto generateInvoice(InvoiceRequestDto requestDto) {
        log.info("Generating invoice for payment ID: {}", requestDto.getPaymentId());

        PaymentOrder paymentOrder = paymentOrderRepository.findByRazorpayPaymentId(requestDto.getPaymentId())
                .orElseGet(() -> paymentOrderRepository.findAll().stream()
                        .filter(p -> requestDto.getPaymentId().equals(p.getRazorpayPaymentId()))
                        .findFirst()
                        .orElseThrow(() -> new ResourceNotFoundException("Payment order not found")));

        User user = paymentOrder.getUser() != null ? paymentOrder.getUser() : getCurrentUser();

        String invNumber = "INV" + System.currentTimeMillis();
        double amount = paymentOrder.getAmount();
        double tax = Math.round((amount * 0.18) * 100.0) / 100.0;
        double totalAmount = amount + tax;

        String pdfFileName = invNumber + ".pdf";
        String fullPath = PdfConfig.STORAGE_DIRECTORY + File.separator + pdfFileName;

        Invoice invoice = Invoice.builder()
                .invoiceNumber(invNumber)
                .user(user)
                .paymentOrder(paymentOrder)
                .amount(amount)
                .tax(tax)
                .totalAmount(totalAmount)
                .invoiceStatus(InvoiceStatus.GENERATED)
                .pdfPath(fullPath)
                .build();

        invoice = invoiceRepository.save(invoice);

        try {
            InvoicePdfUtil.generateInvoicePdf(invoice, fullPath);
            log.info("Invoice PDF generated at: {}", fullPath);
        } catch (Exception e) {
            log.error("Failed to generate PDF for invoice: {}", invNumber, e);
            invoice.setInvoiceStatus(InvoiceStatus.FAILED);
            invoiceRepository.save(invoice);
            throw new InvoiceException("Failed to generate PDF invoice", e);
        }

        String downloadUrl = "http://localhost:8080/api/invoices/download/" + invoice.getId();

        return InvoiceResponseDto.builder()
                .invoiceNumber(invNumber)
                .pdfUrl(downloadUrl)
                .build();
    }

    public Resource downloadInvoice(Long invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found"));

        File file = new File(invoice.getPdfPath());
        if (!file.exists()) {
            throw new InvoiceException("PDF file not found on server");
        }

        return new FileSystemResource(file);
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
