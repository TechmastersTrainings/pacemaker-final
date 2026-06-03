package com.marrow.example.util;

import com.razorpay.Utils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.json.JSONObject;

@Component
@Slf4j
public class RazorpaySignatureUtil {

    @Value("${razorpay.key.secret}")
    private String secret;

    public boolean verifySignature(String orderId, String paymentId, String signature) {
        try {
            JSONObject options = new JSONObject();
            options.put("razorpay_order_id", orderId);
            options.put("razorpay_payment_id", paymentId);
            options.put("razorpay_signature", signature);
            return Utils.verifyPaymentSignature(options, secret);
        } catch (Exception e) {
            log.error("Exception during signature verification", e);
            return false;
        }
    }
}
