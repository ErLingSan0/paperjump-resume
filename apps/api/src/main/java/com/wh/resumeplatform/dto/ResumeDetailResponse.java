package com.wh.resumeplatform.dto;

import java.time.Instant;

import com.fasterxml.jackson.databind.JsonNode;

public record ResumeDetailResponse(
        Long id,
        String title,
        Long templateId,
        String templateName,
        String status,
        String visibility,
        Instant createdAt,
        Instant updatedAt,
        JsonNode content) {
}
