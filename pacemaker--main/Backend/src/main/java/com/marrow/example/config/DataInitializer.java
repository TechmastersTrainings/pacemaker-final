package com.marrow.example.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.marrow.example.entity.User;
import com.marrow.example.repository.UserRepository;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner initData(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            // Create Admin user if not exists
            if (userRepository.findByEmail("techmasterstrainings@gmail.com").isEmpty()) {
                User admin = User.builder()
                        .name("Super Admin")
                        .email("techmasterstrainings@gmail.com")
                        .password(passwordEncoder.encode("Fri10Feb@2023"))
                        .role("ADMIN")
                        .enabled(true)
                        .build();
                userRepository.save(admin);
                System.out.println("Admin user created: techmasterstrainings@gmail.com");
            }
        };
    }
}
