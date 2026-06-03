package com.marrow.example.service;

import com.marrow.example.dto.PaginationResponseDto;
import com.marrow.example.dto.QuestionResponseDto;
import com.marrow.example.entity.Question;
import com.marrow.example.entity.Tag;
import com.marrow.example.enums.DifficultyLevel;
import com.marrow.example.repository.QuestionRepository;
import com.marrow.example.specification.QuestionSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QBankService {

    private final QuestionRepository questionRepository;

    public PaginationResponseDto<QuestionResponseDto> getQuestions(String subject, String tag, String difficulty, Pageable pageable) {
        Specification<Question> spec = Specification.where(null);

        if (subject != null && !subject.isEmpty()) {
            spec = spec.and(QuestionSpecification.hasSubject(subject));
        }

        if (tag != null && !tag.isEmpty()) {
            spec = spec.and(QuestionSpecification.hasTag(tag));
        }

        if (difficulty != null && !difficulty.isEmpty()) {
            try {
                DifficultyLevel diffLevel = DifficultyLevel.valueOf(difficulty.toUpperCase());
                spec = spec.and(QuestionSpecification.hasDifficulty(diffLevel));
            } catch (IllegalArgumentException e) {
                // Invalid difficulty provided, ignoring or you can throw InvalidFilterException.
            }
        }

        Page<Question> questionPage = questionRepository.findAll(spec, pageable);

        return PaginationResponseDto.<QuestionResponseDto>builder()
                .content(questionPage.getContent().stream().map(this::mapToDto).collect(Collectors.toList()))
                .page(questionPage.getNumber())
                .size(questionPage.getSize())
                .totalElements(questionPage.getTotalElements())
                .totalPages(questionPage.getTotalPages())
                .build();
    }
    
    public PaginationResponseDto<QuestionResponseDto> getQuestionsBySubject(String subjectName, Pageable pageable) {
        return getQuestions(subjectName, null, null, pageable);
    }
    
    public PaginationResponseDto<QuestionResponseDto> getQuestionsByDifficulty(String difficulty, Pageable pageable) {
        return getQuestions(null, null, difficulty, pageable);
    }
    
    public PaginationResponseDto<QuestionResponseDto> getQuestionsByTag(String tagName, Pageable pageable) {
        return getQuestions(null, tagName, null, pageable);
    }

    private QuestionResponseDto mapToDto(Question question) {
        return QuestionResponseDto.builder()
                .id(question.getId())
                .questionText(question.getQuestionText())
                .difficulty(question.getDifficulty().name())
                .subject(question.getSubject().getSubjectName())
                .tags(question.getTags().stream().map(Tag::getTagName).collect(Collectors.toList()))
                .build();
    }
}