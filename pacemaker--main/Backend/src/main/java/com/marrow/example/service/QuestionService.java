package com.marrow.example.service;

import com.marrow.example.dto.QuestionResponseDto;
import com.marrow.example.entity.Question;
import com.marrow.example.entity.Tag;
import com.marrow.example.exception.ResourceNotFoundException;
import com.marrow.example.repository.QuestionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class QuestionService {

    private final QuestionRepository questionRepository;

    @Cacheable(value = "questions", key = "'question:list'")
    public List<QuestionResponseDto> getAllQuestions() {
        log.info("Fetching all questions from database (Cache Miss)");
        return questionRepository.findAll().stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Cacheable(value = "questions", key = "'question:details:' + #id")
    public QuestionResponseDto getQuestionById(Long id) {
        log.info("Fetching question details for ID: {} from database (Cache Miss)", id);
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found with id: " + id));
        return mapToDto(question);
    }

    private QuestionResponseDto mapToDto(Question question) {
        return QuestionResponseDto.builder()
                .id(question.getId())
                .questionText(question.getQuestionText())
                .difficulty(question.getDifficulty() != null ? question.getDifficulty().name() : "MEDIUM")
                .subject(question.getSubject() != null ? question.getSubject().getSubjectName() : "GENERAL")
                .tags(question.getTags() != null ? question.getTags().stream().map(Tag::getTagName).collect(Collectors.toList()) : List.of())
                .build();
    }
}
