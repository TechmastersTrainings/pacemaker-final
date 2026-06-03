package com.marrow.example.controller;

import com.marrow.example.dto.SearchHistoryDto;
import com.marrow.example.dto.SearchResponseDto;
import com.marrow.example.service.SearchService;
import com.marrow.example.service.SearchSuggestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;
    private final SearchSuggestionService suggestionService;

    @GetMapping
    public ResponseEntity<SearchResponseDto> globalSearch(
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "relevance") String sort) {
        return ResponseEntity.ok(searchService.globalSearch(q, page, size, sort));
    }

    @GetMapping("/suggestions")
    public ResponseEntity<List<String>> getSuggestions(@RequestParam(defaultValue = "") String q) {
        return ResponseEntity.ok(suggestionService.getSuggestions(q));
    }

    @GetMapping("/history")
    public ResponseEntity<List<SearchHistoryDto>> getSearchHistory() {
        return ResponseEntity.ok(searchService.getSearchHistory());
    }
}
