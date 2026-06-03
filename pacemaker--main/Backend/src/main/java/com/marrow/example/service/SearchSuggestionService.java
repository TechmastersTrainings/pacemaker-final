package com.marrow.example.service;

import com.marrow.example.repository.LiveClassRepository;
import com.marrow.example.repository.QuestionRepository;
import com.marrow.example.repository.VideoRepository;
import com.marrow.example.util.SearchUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SearchSuggestionService {

    private final VideoRepository videoRepository;
    private final QuestionRepository questionRepository;
    private final LiveClassRepository liveClassRepository;

    public List<String> getSuggestions(String keyword) {
        String cleanKw = SearchUtil.cleanKeyword(keyword);
        if (cleanKw.isEmpty()) {
            return new ArrayList<>();
        }

        PageRequest limit = PageRequest.of(0, 5);

        List<String> suggestions = new ArrayList<>();

        videoRepository.searchVideos(cleanKw, limit)
                .getContent().forEach(v -> suggestions.add(v.getTitle()));

        questionRepository.searchQuestions(cleanKw, limit)
                .getContent().forEach(q -> {
                    if (q.getTopic() != null && !q.getTopic().isEmpty()) {
                        suggestions.add(q.getTopic());
                    }
                });

        liveClassRepository.searchLiveClasses(cleanKw, limit)
                .getContent().forEach(l -> suggestions.add(l.getTitle()));

        return suggestions.stream().distinct().limit(10).collect(Collectors.toList());
    }
}
