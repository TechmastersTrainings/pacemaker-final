package com.marrow.example.dto;

public class MuxUploadResponse {

    private String uploadUrl;

    private String uploadId;

    public MuxUploadResponse() {

    }

    public MuxUploadResponse(
            String uploadUrl,
            String uploadId) {

        this.uploadUrl = uploadUrl;
        this.uploadId = uploadId;
    }

    public String getUploadUrl() {
        return uploadUrl;
    }

    public void setUploadUrl(String uploadUrl) {
        this.uploadUrl = uploadUrl;
    }

    public String getUploadId() {
        return uploadId;
    }

    public void setUploadId(String uploadId) {
        this.uploadId = uploadId;
    }
}