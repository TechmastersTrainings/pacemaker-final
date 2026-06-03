package com.marrow.example.security;

import java.io.IOException;
import java.util.Collections;
import java.util.List;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.marrow.example.entity.User;
import com.marrow.example.repository.UserRepository;
import com.marrow.example.util.JwtUtil;
import com.marrow.example.util.RoleUtil;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String token = authHeader.substring(7);
            String email = jwtUtil.extractEmail(token);
            String role = jwtUtil.extractRole(token);

            if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                if (role == null) {
                    User user = userRepository.findByEmail(email).orElse(null);
                    role = (user != null && user.getRole() != null) ? user.getRole() : "ROLE_STUDENT";
                }
                String formattedRole = RoleUtil.formatRole(role);

                List<GrantedAuthority> authorities = Collections.singletonList(new SimpleGrantedAuthority(formattedRole));

                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        email, null, authorities);
                
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (Exception e) {
            // If token is invalid or expired, we just don't set the authentication.
            // Authority-based checks (anyRequest().authenticated()) will then handle the restriction.
            // This ensures that public endpoints (permitAll()) are still accessible even if 
            // a malformed/expired token is present in the headers.
            logger.debug("Invalid JWT token: " + e.getMessage());
        }

        filterChain.doFilter(request, response);
    }
}
