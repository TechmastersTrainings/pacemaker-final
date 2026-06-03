package com.marrow.example.util;

import com.marrow.example.config.DiscourseConfig;
import com.marrow.example.entity.User;
import com.marrow.example.exception.SSOException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class DiscoursePayloadUtil {

    private final DiscourseConfig discourseConfig;

    public String generateSsoPayload(User user, String incomingSsoNonce) {
        try {
            String nonce = incomingSsoNonce != null && !incomingSsoNonce.isBlank() ? incomingSsoNonce : UUID.randomUUID().toString();
            String username = user.getName() != null ? user.getName().replaceAll("\\s+", "").toLowerCase() : user.getEmail().split("@")[0];
            String name = user.getName() != null ? user.getName() : username;
            String role = user.getRole() != null ? user.getRole() : "STUDENT";

            StringBuilder payloadBuilder = new StringBuilder();
            payloadBuilder.append("nonce=").append(URLEncoder.encode(nonce, StandardCharsets.UTF_8));
            payloadBuilder.append("&email=").append(URLEncoder.encode(user.getEmail(), StandardCharsets.UTF_8));
            payloadBuilder.append("&external_id=").append(URLEncoder.encode(String.valueOf(user.getId()), StandardCharsets.UTF_8));
            payloadBuilder.append("&username=").append(URLEncoder.encode(username, StandardCharsets.UTF_8));
            payloadBuilder.append("&name=").append(URLEncoder.encode(name, StandardCharsets.UTF_8));
            payloadBuilder.append("&add_groups=").append(URLEncoder.encode(role, StandardCharsets.UTF_8));

            String base64Payload = Base64.getEncoder().encodeToString(payloadBuilder.toString().getBytes(StandardCharsets.UTF_8));
            String signature = calculateHmac256(base64Payload, discourseConfig.getSsoSecret());

            String encodedSso = URLEncoder.encode(base64Payload, StandardCharsets.UTF_8);
            return discourseConfig.getBaseUrl() + "/session/sso_login?sso=" + encodedSso + "&sig=" + signature;
        } catch (Exception e) {
            log.error("Failed to generate Discourse SSO payload", e);
            throw new SSOException("Failed to generate Discourse SSO payload", e);
        }
    }

    public boolean validateIncomingSso(String sso, String sig) {
        try {
            String expectedSig = calculateHmac256(sso, discourseConfig.getSsoSecret());
            return expectedSig.equalsIgnoreCase(sig);
        } catch (Exception e) {
            log.error("Failed to validate incoming SSO signature", e);
            return false;
        }
    }

    public String extractNonce(String ssoPayload) {
        try {
            String decodedPayload = new String(Base64.getDecoder().decode(ssoPayload), StandardCharsets.UTF_8);
            String[] params = decodedPayload.split("&");
            for (String param : params) {
                String[] pair = param.split("=");
                if (pair.length == 2 && pair[0].equalsIgnoreCase("nonce")) {
                    return URLDecoder.decode(pair[1], StandardCharsets.UTF_8);
                }
            }
            return null;
        } catch (Exception e) {
            log.error("Failed to extract nonce from SSO payload", e);
            return null;
        }
    }

    private String calculateHmac256(String data, String secret) throws Exception {
        Mac sha256Hmac = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKey = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        sha256Hmac.init(secretKey);
        byte[] hash = sha256Hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        StringBuilder hexString = new StringBuilder();
        for (byte b : hash) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) hexString.append('0');
            hexString.append(hex);
        }
        return hexString.toString();
    }
}
