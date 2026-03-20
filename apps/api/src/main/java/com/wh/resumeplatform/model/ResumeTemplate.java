package com.wh.resumeplatform.model;

import java.time.Instant;

public record ResumeTemplate(
        Long id,
        String code,
        String name,
        String category,
        String coverImageUrl,
        TemplateSchema schema,
        boolean favorited,
        Instant createdAt,
        Instant updatedAt) {
}
