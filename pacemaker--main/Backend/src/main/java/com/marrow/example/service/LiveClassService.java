package com.marrow.example.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.marrow.example.dto.LiveClassRequest;
import com.marrow.example.entity.LiveClass;
import com.marrow.example.repository.LiveClassRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class LiveClassService {

    private final LiveClassRepository liveClassRepository;

    public LiveClass createLiveClass(LiveClassRequest request) {
        String meetingId = UUID.randomUUID().toString();
        String zoomJoinUrl = "https://zoom.us/j/" + meetingId;

        LiveClass liveClass = LiveClass.builder()
                .title(request.getTitle())
                .classDateTime(request.getClassDateTime())
                .zoomJoinUrl(zoomJoinUrl)
                .zoomMeetingId(meetingId)
                .build();

        return liveClassRepository.save(liveClass);
    }

    public List<LiveClass> getAllLiveClasses() {
        return liveClassRepository.findAll();
    }
}