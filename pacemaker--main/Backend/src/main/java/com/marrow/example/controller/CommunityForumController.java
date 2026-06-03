package com.marrow.example.controller;

import org.springframework.web.bind.annotation.*;

import com.marrow.example.dto.CommunityForumRequest;
import com.marrow.example.dto.CommunityForumResponse;
import com.marrow.example.service.CommunityForumService;

@RestController
@RequestMapping("/api/v1/community")

public class CommunityForumController {

    private final CommunityForumService
            communityForumService;

    public CommunityForumController(

            CommunityForumService
                    communityForumService) {

        this.communityForumService =
                communityForumService;
    }

    // CREATE FORUM

    @PostMapping

    public CommunityForumResponse
    createForum(

            @RequestBody
            CommunityForumRequest request) {

        return communityForumService
                .createForum(request);
    }
}