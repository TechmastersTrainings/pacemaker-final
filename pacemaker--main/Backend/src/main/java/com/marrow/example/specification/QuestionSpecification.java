package com.marrow.example.specification;

import com.marrow.example.entity.Question;
import com.marrow.example.entity.Subject;
import com.marrow.example.entity.Tag;
import com.marrow.example.enums.DifficultyLevel;
import jakarta.persistence.criteria.Join;
import org.springframework.data.jpa.domain.Specification;

public class QuestionSpecification {

    public static Specification<Question> hasSubject(String subjectName) {
        return (root, query, criteriaBuilder) -> {
            if (subjectName == null || subjectName.isEmpty()) {
                return null;
            }
            Join<Question, Subject> subjectJoin = root.join("subject");
            return criteriaBuilder.equal(subjectJoin.get("subjectName"), subjectName);
        };
    }

    public static Specification<Question> hasTag(String tagName) {
        return (root, query, criteriaBuilder) -> {
            if (tagName == null || tagName.isEmpty()) {
                return null;
            }
            Join<Question, Tag> tagJoin = root.join("tags");
            return criteriaBuilder.equal(tagJoin.get("tagName"), tagName);
        };
    }

    public static Specification<Question> hasDifficulty(DifficultyLevel difficulty) {
        return (root, query, criteriaBuilder) -> {
            if (difficulty == null) {
                return null;
            }
            return criteriaBuilder.equal(root.get("difficulty"), difficulty);
        };
    }
}
