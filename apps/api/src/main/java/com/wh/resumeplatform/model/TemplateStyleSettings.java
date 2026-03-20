package com.wh.resumeplatform.model;

public record TemplateStyleSettings(
        String layoutPreset,
        String accentTone,
        String fontFamily,
        String titleStyle,
        double bodyFontSize,
        double lineHeight,
        int pagePadding,
        int sectionSpacing) {
}
