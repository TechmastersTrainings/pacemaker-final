package com.marrow.example.controller;

import org.springframework.web.bind.annotation.*;

import com.marrow.example.dto.LiveRecordingRequest;
import com.marrow.example.dto.LiveRecordingResponse;
import com.marrow.example.service.LiveRecordingService;

@RestController
@RequestMapping("/api/v1/live-recordings")

public class LiveRecordingController {

    private final LiveRecordingService
            liveRecordingService;

    public LiveRecordingController(
            LiveRecordingService
                    liveRecordingService) {

        this.liveRecordingService =
                liveRecordingService;
    }

    // UPLOAD RECORDING

    @PostMapping

    public LiveRecordingResponse
    uploadRecording(

            @RequestBody
            LiveRecordingRequest request) {

        return liveRecordingService
                .uploadRecording(request);
    }
}