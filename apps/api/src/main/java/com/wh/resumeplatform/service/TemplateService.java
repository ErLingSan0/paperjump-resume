package com.wh.resumeplatform.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.wh.resumeplatform.auth.AuthenticatedUser;
import com.wh.resumeplatform.common.ApiException;
import com.wh.resumeplatform.dto.TemplateResponse;
import com.wh.resumeplatform.dto.TemplateStyleSettingsResponse;
import com.wh.resumeplatform.model.ResumeTemplate;
import com.wh.resumeplatform.model.TemplateCatalogEntry;
import com.wh.resumeplatform.model.TemplateSchema;
import com.wh.resumeplatform.model.TemplateStyleSettings;
import com.wh.resumeplatform.repository.ResumeTemplateRepository;

@Service
public class TemplateService {

    private static final String DEFAULT_LAYOUT_VARIANT = "profile-purple";

    private final ResumeTemplateRepository resumeTemplateRepository;
    private final TemplateCatalogRegistry templateCatalogRegistry;

    public TemplateService(
            ResumeTemplateRepository resumeTemplateRepository,
            TemplateCatalogRegistry templateCatalogRegistry) {
        this.resumeTemplateRepository = resumeTemplateRepository;
        this.templateCatalogRegistry = templateCatalogRegistry;
    }

    public List<TemplateResponse> listTemplates(AuthenticatedUser user) {
        Long userId = user == null ? null : user.id();
        return resumeTemplateRepository.findActiveTemplates(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    public void setFavorite(Long templateId, boolean favorited, AuthenticatedUser user) {
        ResumeTemplate template = resumeTemplateRepository.findActiveTemplateById(templateId, user.id())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "模板不存在或已下线"));
        resumeTemplateRepository.setFavorite(user.id(), template.id(), favorited);
    }

    public void ensureTemplateExists(Long templateId) {
        if (templateId == null) {
            return;
        }
        resumeTemplateRepository.findActiveTemplateById(templateId, null)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "所选模板不存在或已下线"));
    }

    private TemplateResponse toResponse(ResumeTemplate template) {
        TemplateSchema schema = template.schema();
        TemplateStyleSettings settings = schema.settings();
        TemplateCatalogEntry catalogEntry = templateCatalogRegistry.findByCode(template.code());
        String layoutVariant = catalogEntry == null || catalogEntry.layoutVariant() == null
                ? DEFAULT_LAYOUT_VARIANT
                : catalogEntry.layoutVariant();
        List<String> sectionOrder = catalogEntry == null || catalogEntry.sectionOrder() == null
                ? List.of()
                : catalogEntry.sectionOrder();
        return new TemplateResponse(
                template.id(),
                template.code(),
                template.name(),
                template.coverImageUrl(),
                schema.description(),
                schema.badge(),
                schema.spotlight(),
                new TemplateStyleSettingsResponse(
                        settings.layoutPreset(),
                        settings.accentTone(),
                        settings.fontFamily(),
                        settings.titleStyle(),
                        settings.bodyFontSize(),
                        settings.lineHeight(),
                        settings.pagePadding(),
                        settings.sectionSpacing()),
                layoutVariant,
                sectionOrder,
                catalogEntry == null ? null : catalogEntry.starterContent(),
                catalogEntry != null && catalogEntry.galleryVisible(),
                template.favorited());
    }
}
