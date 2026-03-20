package com.wh.resumeplatform.dto;

public record TemplateStyleSettingsResponse(
        String layoutPreset,
        String accentTone,
        String fontFamily,
        String titleStyle,
        double bodyFontSize,
        double lineHeight,
        int pagePadding,
        int sectionSpacing) {
}
