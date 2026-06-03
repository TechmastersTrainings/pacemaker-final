package com.marrow.example.controller;

import java.util.List;

import org.springframework.web.bind.annotation.*;

import com.marrow.example.dto.VideoCommentRequest;
import com.marrow.example.entity.VideoComment;
import com.marrow.example.service.VideoCommentService;

@RestController
@RequestMapping("/api/v1/video-comments")

public class VideoCommentController {

    private final VideoCommentService
            videoCommentService;

    public VideoCommentController(
            VideoCommentService
                    videoCommentService) {

        this.videoCommentService =
                videoCommentService;
    }

    // CREATE COMMENT

    @PostMapping

    public VideoComment createComment(
            @RequestBody
            VideoCommentRequest request) {

        return videoCommentService
                .createComment(request);
    }

    // GET COMMENTS BY VIDEO

    @GetMapping("/video/{videoId}")

    public List<VideoComment>
    getCommentsByVideo(
            @PathVariable Long videoId) {

        return videoCommentService
                .getCommentsByVideo(videoId);
    }

    // GET COMMENT BY ID

    @GetMapping("/{id}")

    public VideoComment getCommentById(
            @PathVariable Long id) {

        return videoCommentService
                .getCommentById(id);
    }

    // UPDATE COMMENT

    @PutMapping("/{id}")

    public VideoComment updateComment(
            @PathVariable Long id,
            @RequestBody
            VideoCommentRequest request) {

        return videoCommentService
                .updateComment(id, request);
    }

    // DELETE COMMENT

    @DeleteMapping("/{id}")

    public String deleteComment(
            @PathVariable Long id) {

        videoCommentService
                .deleteComment(id);

        return "Comment Deleted Successfully";
    }

    @GetMapping
    public List<VideoComment> getAllComments() {
        return videoCommentService.getAllComments();
    }
}