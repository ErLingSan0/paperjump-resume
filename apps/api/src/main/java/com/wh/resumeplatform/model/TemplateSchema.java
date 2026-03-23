package com.wh.resumeplatform.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record TemplateSchema(
        String description,
        String badge,
        String spotlight,
        TemplateStyleSettings settings) {
}
