package com.marrow.example.service;

import com.marrow.example.dto.*;
import com.marrow.example.entity.LiveClass;
import com.marrow.example.entity.Question;
import com.marrow.example.entity.SearchHistory;
import com.marrow.example.entity.Tag;
import com.marrow.example.entity.User;
import com.marrow.example.entity.Video;
import com.marrow.example.exception.ResourceNotFoundException;
import com.marrow.example.repository.*;
import com.marrow.example.util.SearchUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SearchService {

    private final VideoRepository videoRepository;
    private final QuestionRepository questionRepository;
    private final LiveClassRepository liveClassRepository;
    private final SearchHistoryRepository historyRepository;
    private final UserRepository userRepository;

    @Transactional
    public SearchResponseDto globalSearch(String keyword, int page, int size, String sortParam) {
        String cleanKw = SearchUtil.cleanKeyword(keyword);
        log.info("Performing global search for keyword: {}", cleanKw);

        User user = getCurrentUser();
        if (!cleanKw.isEmpty()) {
            SearchHistory history = SearchHistory.builder()
                    .user(user)
                    .keyword(cleanKw)
                    .searchTime(LocalDateTime.now())
                    .build();
            historyRepository.save(history);
        }

        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("id").descending());

        Page<Video> videoPage = videoRepository.searchVideos(cleanKw, pageRequest);
        Page<Question> questionPage = questionRepository.searchQuestions(cleanKw, pageRequest);
        Page<LiveClass> liveClassPage = liveClassRepository.searchLiveClasses(cleanKw, pageRequest);

        List<VideoSearchDto> videoDtos = videoPage.getContent().stream()
                .map(v -> VideoSearchDto.builder()
                        .id(v.getId())
                        .title(v.getTitle())
                        .description(v.getDescription())
                        .category(v.getCategory() != null ? v.getCategory().name() : "")
                        .tags(v.getTags())
                        .duration(v.getDuration())
                        .thumbnailUrl(v.getThumbnailUrl())
                        .build())
                .collect(Collectors.toList());

        List<MCQSearchDto> mcqDtos = questionPage.getContent().stream()
                .map(q -> MCQSearchDto.builder()
                        .id(q.getId())
                        .question(q.getQuestionText())
                        .subject(q.getSubject() != null ? q.getSubject().getSubjectName() : "")
                        .topic(q.getTopic())
                        .tags(q.getTags() != null ? q.getTags().stream().map(Tag::getTagName).collect(Collectors.joining(",")) : "")
                        .build())
                .collect(Collectors.toList());

        List<LiveClassSearchDto> lcDtos = liveClassPage.getContent().stream()
                .map(l -> LiveClassSearchDto.builder()
                        .id(l.getId())
                        .title(l.getTitle())
                        .trainer(l.getTrainerName())
                        .topic(l.getTopic())
                        .scheduledTime(l.getClassDateTime())
                        .build())
                .collect(Collectors.toList());

        return SearchResponseDto.builder()
                .videos(videoDtos)
                .mcqs(mcqDtos)
                .liveClasses(lcDtos)
                .build();
    }

    public List<SearchHistoryDto> getSearchHistory() {
        User user = getCurrentUser();
        return historyRepository.findByUserIdOrderBySearchTimeDesc(user.getId())
                .stream()
                .map(h -> SearchHistoryDto.builder()
                        .keyword(h.getKeyword())
                        .searchTime(h.getSearchTime())
                        .build())
                .collect(Collectors.toList());
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
