package com.wh.resumeplatform.service;

import java.io.IOException;
import java.io.InputStream;
import java.util.Collections;
import java.util.Map;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wh.resumeplatform.model.TemplateCatalogEntry;

@Component
public class TemplateCatalogRegistry {

    private final Map<String, TemplateCatalogEntry> entries;

    public TemplateCatalogRegistry(ObjectMapper objectMapper) {
        try (InputStream inputStream = new ClassPathResource("template-catalog.json").getInputStream()) {
            this.entries = Collections.unmodifiableMap(objectMapper.readValue(
                    inputStream,
                    new TypeReference<Map<String, TemplateCatalogEntry>>() {
                    }));
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to load template catalog metadata", exception);
        }
    }

    public TemplateCatalogEntry findByCode(String code) {
        return entries.get(code);
    }
}
