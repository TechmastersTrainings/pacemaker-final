package com.marrow.example.service;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.marrow.example.dto.LiveRecordingRequest;
import com.marrow.example.dto.LiveRecordingResponse;
import com.marrow.example.entity.LiveRecording;
import com.marrow.example.repository.LiveRecordingRepository;

@Service
public class LiveRecordingService {

    private final LiveRecordingRepository
            liveRecordingRepository;

    public LiveRecordingService(
            LiveRecordingRepository
                    liveRecordingRepository) {

        this.liveRecordingRepository =
                liveRecordingRepository;
    }

    // STORE RECORDING

    public LiveRecordingResponse
    uploadRecording(
            LiveRecordingRequest request) {

        /*
         TEMPORARY MUX MOCK
         Production:
         Upload Zoom Recording to Mux API
        */

        String muxAssetId =
                UUID.randomUUID().toString();

        String muxPlaybackUrl =
                "https://stream.mux.com/"
                        + muxAssetId
                        + ".m3u8";

        LiveRecording recording =
                LiveRecording.builder()
                        .liveClassId(
                                request.getLiveClassId())
                        .zoomRecordingUrl(
                                request
                                        .getZoomRecordingUrl())
                        .muxAssetId(
                                muxAssetId)
                        .muxPlaybackUrl(
                                muxPlaybackUrl)
                        .build();

        LiveRecording saved =
                liveRecordingRepository
                        .save(recording);

        return LiveRecordingResponse
                .builder()
                .id(saved.getId())
                .liveClassId(
                        saved.getLiveClassId())
                .zoomRecordingUrl(
                        saved
                                .getZoomRecordingUrl())
                .muxAssetId(
                        saved.getMuxAssetId())
                .muxPlaybackUrl(
                        saved
                                .getMuxPlaybackUrl())
                .build();
    }
}