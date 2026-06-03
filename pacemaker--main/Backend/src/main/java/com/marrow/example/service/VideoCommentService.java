package com.marrow.example.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.marrow.example.dto.VideoCommentRequest;
import com.marrow.example.entity.VideoComment;
import com.marrow.example.repository.VideoCommentRepository;
import com.marrow.example.exception.ResourceNotFoundException;

@Service
public class VideoCommentService {

    private final VideoCommentRepository
            videoCommentRepository;

    public VideoCommentService(
            VideoCommentRepository
                    videoCommentRepository) {

        this.videoCommentRepository =
                videoCommentRepository;
    }

    // CREATE COMMENT

    public VideoComment createComment(
            VideoCommentRequest request) {

        VideoComment comment =
                VideoComment.builder()
                        .videoId(
                                request.getVideoId())
                        .userId(
                                request.getUserId())
                        .commentText(
                                request.getCommentText())
                        .parentCommentId(
                                request.getParentCommentId())
                        .build();

        return videoCommentRepository
                .save(comment);
    }

    // GET COMMENTS BY VIDEO

    public List<VideoComment>
    getCommentsByVideo(
            Long videoId) {

        return videoCommentRepository
                .findByVideoId(videoId);
    }

    // GET COMMENT BY ID

    public VideoComment getCommentById(
            Long id) {

        return videoCommentRepository
                .findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Comment Not Found"));
    }

    // UPDATE COMMENT

    public VideoComment updateComment(
            Long id,
            VideoCommentRequest request) {

        VideoComment comment =
                getCommentById(id);

        comment.setCommentText(
                request.getCommentText());

        return videoCommentRepository
                .save(comment);
    }

    // DELETE COMMENT

    public void deleteComment(
            Long id) {

        videoCommentRepository
                .deleteById(id);
    }

    public List<VideoComment> getAllComments() {
        return videoCommentRepository.findAll();
    }
}