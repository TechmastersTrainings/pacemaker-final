package com.marrow.example.util;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.marrow.example.entity.Invoice;

import java.io.FileOutputStream;
import java.io.IOException;

public class InvoicePdfUtil {

    public static void generateInvoicePdf(Invoice invoice, String targetFilePath) throws IOException, DocumentException {
        Document document = new Document(PageSize.A4);
        PdfWriter.getInstance(document, new FileOutputStream(targetFilePath));

        document.open();

        Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22);
        Font subHeaderFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14);
        Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 12);
        Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);

        Paragraph title = new Paragraph("PACEMAKER INVOICE", headerFont);
        title.setAlignment(Element.ALIGN_CENTER);
        document.add(title);
        document.add(new Paragraph("\n"));

        document.add(new Paragraph("Invoice Number: " + invoice.getInvoiceNumber(), boldFont));
        document.add(new Paragraph("Date: " + invoice.getCreatedAt().toLocalDate().toString(), normalFont));
        document.add(new Paragraph("Billed To: " + (invoice.getUser() != null ? invoice.getUser().getName() : "Student"), normalFont));
        document.add(new Paragraph("Email: " + (invoice.getUser() != null ? invoice.getUser().getEmail() : "student@gmail.com"), normalFont));
        document.add(new Paragraph("\n\n"));

        PdfPTable table = new PdfPTable(4);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{4f, 2f, 2f, 2f});

        addTableHeader(table, boldFont, "Description", "Base Amount", "Tax (18%)", "Total");

        String planName = invoice.getPaymentOrder() != null && invoice.getPaymentOrder().getPlan() != null && invoice.getPaymentOrder().getPlan().getPlanType() != null ? 
                invoice.getPaymentOrder().getPlan().getPlanType().name() : "Premium Subscription";

        addTableRow(table, normalFont, planName, "INR " + invoice.getAmount(), "INR " + invoice.getTax(), "INR " + invoice.getTotalAmount());

        document.add(table);
        document.add(new Paragraph("\n\n"));

        Paragraph footer = new Paragraph("Thank you for choosing PaceMaker!", boldFont);
        footer.setAlignment(Element.ALIGN_CENTER);
        document.add(footer);

        document.close();
    }

    private static void addTableHeader(PdfPTable table, Font font, String... headers) {
        for (String header : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(header, font));
            cell.setPadding(8);
            table.addCell(cell);
        }
    }

    private static void addTableRow(PdfPTable table, Font font, String... data) {
        for (String val : data) {
            PdfPCell cell = new PdfPCell(new Phrase(val, font));
            cell.setPadding(8);
            table.addCell(cell);
        }
    }
}
