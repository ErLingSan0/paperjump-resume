package com.wh.resumeplatform.dto;

import java.util.List;

import com.fasterxml.jackson.databind.JsonNode;

public record TemplateResponse(
        Long id,
        String code,
        String name,
        String coverImageUrl,
        String description,
        String badge,
        String spotlight,
        TemplateStyleSettingsResponse settings,
        String layoutVariant,
        List<String> sectionOrder,
        JsonNode starterContent,
        boolean galleryVisible,
        boolean favorited) {
}
