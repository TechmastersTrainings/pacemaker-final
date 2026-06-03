package com.marrow.example.service;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.marrow.example.dto.CommunityForumRequest;
import com.marrow.example.dto.CommunityForumResponse;
import com.marrow.example.entity.CommunityForum;
import com.marrow.example.repository.CommunityForumRepository;

@Service
public class CommunityForumService {

    private final CommunityForumRepository
            communityForumRepository;

    public CommunityForumService(

            CommunityForumRepository
                    communityForumRepository) {

        this.communityForumRepository =
                communityForumRepository;
    }

    // CREATE COMMUNITY FORUM

    public CommunityForumResponse
    createForum(
            CommunityForumRequest request) {

        // DISCOURSE EMBED URL

        String iframeUrl =
                request.getDiscourseUrl()
                        + "/latest";

        // MOCK SSO TOKEN

        String token =
                Base64.getEncoder()
                        .encodeToString(

                                UUID.randomUUID()
                                        .toString()
                                        .getBytes(
                                                StandardCharsets.UTF_8));

        String ssoLoginUrl =
                request.getDiscourseUrl()
                        + "/session/sso_login?sso="
                        + token;

        CommunityForum forum =

                CommunityForum.builder()

                        .forumName(
                                request.getForumName())

                        .discourseUrl(
                                request.getDiscourseUrl())

                        .iframeUrl(
                                iframeUrl)

                        .ssoEnabled(true)

                        .build();

        CommunityForum saved =
                communityForumRepository
                        .save(forum);

        return CommunityForumResponse
                .builder()

                .id(saved.getId())

                .forumName(
                        saved.getForumName())

                .discourseUrl(
                        saved.getDiscourseUrl())

                .iframeUrl(
                        saved.getIframeUrl())

                .ssoEnabled(
                        saved.getSsoEnabled())

                .ssoLoginUrl(
                        ssoLoginUrl)

                .build();
    }
}