package com.wh.resumeplatform.model;

import java.time.Instant;

public record ResumeDocument(
        Long id,
        Long userId,
        Long templateId,
        String templateName,
        String title,
        String status,
        String visibility,
        String contentJson,
        Instant createdAt,
        Instant updatedAt) {
}
