package com.wh.resumeplatform.dto;

import java.time.Instant;

public record ResumeSummaryResponse(
        Long id,
        String title,
        String headline,
        Long templateId,
        String templateName,
        String status,
        String visibility,
        Instant updatedAt) {
}
