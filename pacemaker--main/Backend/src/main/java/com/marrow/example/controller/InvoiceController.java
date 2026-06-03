package com.marrow.example.controller;

import com.marrow.example.dto.InvoiceRequestDto;
import com.marrow.example.dto.InvoiceResponseDto;
import com.marrow.example.service.InvoiceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;

    @PostMapping("/generate")
    public ResponseEntity<InvoiceResponseDto> generateInvoice(@Valid @RequestBody InvoiceRequestDto requestDto) {
        return ResponseEntity.ok(invoiceService.generateInvoice(requestDto));
    }

    @GetMapping("/download/{invoiceId}")
    public ResponseEntity<Resource> downloadInvoice(@PathVariable Long invoiceId) {
        Resource resource = invoiceService.downloadInvoice(invoiceId);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }
}
