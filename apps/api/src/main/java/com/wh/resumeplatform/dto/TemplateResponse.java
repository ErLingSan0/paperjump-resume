package com.wh.resumeplatform.dto;

public record TemplateResponse(
        Long id,
        String code,
        String name,
        String category,
        String coverImageUrl,
        String description,
        String badge,
        String mood,
        String spotlight,
        String previewVariant,
        TemplateStyleSettingsResponse settings,
        boolean favorited) {
}
