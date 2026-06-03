package com.marrow.example.seeder;

import com.marrow.example.entity.Subject;
import com.marrow.example.entity.User;
import com.marrow.example.repository.SubjectRepository;
import com.marrow.example.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.datafaker.Faker;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserSeeder {

    private final UserRepository userRepository;
    private final SubjectRepository subjectRepository;
    private final PasswordEncoder passwordEncoder;
    private final com.marrow.example.repository.TrainerRepository trainerRepository;

    private static final int STUDENT_COUNT = 50;
    private static final String DEFAULT_PASSWORD = "Pacemaker@2024";

    private static final List<String[]> TRAINER_DATA = List.of(
        new String[]{"Dr. Arun Sharma",   "arun.sharma@pacemaker.com",   "Anatomy & Physiology"},
        new String[]{"Dr. Priya Mehta",   "priya.mehta@pacemaker.com",   "Pharmacology & Pathology"},
        new String[]{"Dr. Kiran Reddy",   "kiran.reddy@pacemaker.com",   "Surgery & Clinical Medicine"}
    );

    private static final List<String> SUBJECTS = List.of(
        "Anatomy", "Physiology", "Pathology", "Pharmacology", "Surgery"
    );

    @Transactional
    public int seedSubjects() {
        int created = 0;
        for (String subjectName : SUBJECTS) {
            if (subjectRepository.findBySubjectName(subjectName).isEmpty()) {
                subjectRepository.save(Subject.builder().subjectName(subjectName).build());
                created++;
                log.info("Seeded subject: {}", subjectName);
            }
        }
        return created;
    }

    @Transactional
    public int seedTrainers() {
        int created = 0;
        for (String[] trainerData : TRAINER_DATA) {
            String name  = trainerData[0];
            String email = trainerData[1];
            String spec  = trainerData[2];
            if (userRepository.findByEmail(email).isEmpty()) {
                User user = User.builder()
                    .name(name)
                    .email(email)
                    .password(passwordEncoder.encode(DEFAULT_PASSWORD))
                    .role("TRAINER")
                    .enabled(true)
                    .build();
                User savedUser = userRepository.save(user);
                
                com.marrow.example.entity.Trainer trainer = com.marrow.example.entity.Trainer.builder()
                        .user(savedUser)
                        .specialization(spec)
                        .build();
                trainerRepository.save(trainer);
                
                created++;
                log.info("Seeded trainer: {}", email);
            }
        }
        return created;
    }

    @Transactional
    public int seedStudents() {
        Faker faker = new Faker();
        int created = 0;
        List<User> batch = new ArrayList<>();

        for (int i = 0; i < STUDENT_COUNT; i++) {
            String firstName = faker.name().firstName();
            String lastName  = faker.name().lastName();
            String name      = firstName + " " + lastName;
            // Unique email: firstname.lastname.<random>@pacemaker.com
            String email = (firstName + "." + lastName + "." + faker.number().digits(4))
                               .toLowerCase().replaceAll("[^a-z0-9.]", "") + "@pacemaker.com";

            if (userRepository.findByEmail(email).isEmpty()) {
                batch.add(User.builder()
                    .name(name)
                    .email(email)
                    .password(passwordEncoder.encode(DEFAULT_PASSWORD))
                    .role("STUDENT")
                    .enabled(true)
                    .build());
                created++;
            }
        }

        userRepository.saveAll(batch);
        log.info("Seeded {} new students", created);
        return created;
    }
}
