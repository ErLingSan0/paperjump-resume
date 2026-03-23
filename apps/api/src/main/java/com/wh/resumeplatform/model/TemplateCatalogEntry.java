package com.wh.resumeplatform.model;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.JsonNode;

@JsonIgnoreProperties(ignoreUnknown = true)
public record TemplateCatalogEntry(
        boolean galleryVisible,
        String layoutVariant,
        List<String> sectionOrder,
        JsonNode starterContent) {
}
