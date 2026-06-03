package com.marrow.example.seeder;

import com.marrow.example.service.DataSeederService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataLoader implements CommandLineRunner {

    private final DataSeederService dataSeederService;
    private final Environment environment;

    @Override
    public void run(String... args) throws Exception {
        String[] activeProfiles = environment.getActiveProfiles();
        boolean isDevOrDemo = Arrays.stream(activeProfiles)
                .anyMatch(profile -> profile.equals("dev") || profile.equals("demo"));

        if (isDevOrDemo) {
            log.info("Application starting in DEV/DEMO profile. Executing data seeding...");
            try {
                dataSeederService.runSeedData();
                log.info("Data seeding process finished successfully.");
            } catch (Exception e) {
                log.error("Error occurred during data seeding: {}", e.getMessage(), e);
            }
        } else {
            log.info("Skipping data seeding. Current profile is not dev or demo.");
        }
    }
}
