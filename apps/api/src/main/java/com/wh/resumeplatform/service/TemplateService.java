package com.wh.resumeplatform.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.wh.resumeplatform.auth.AuthenticatedUser;
import com.wh.resumeplatform.common.ApiException;
import com.wh.resumeplatform.dto.TemplateResponse;
import com.wh.resumeplatform.dto.TemplateStyleSettingsResponse;
import com.wh.resumeplatform.model.ResumeTemplate;
import com.wh.resumeplatform.model.TemplateSchema;
import com.wh.resumeplatform.model.TemplateStyleSettings;
import com.wh.resumeplatform.repository.ResumeTemplateRepository;

@Service
public class TemplateService {

    private final ResumeTemplateRepository resumeTemplateRepository;

    public TemplateService(ResumeTemplateRepository resumeTemplateRepository) {
        this.resumeTemplateRepository = resumeTemplateRepository;
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
        return new TemplateResponse(
                template.id(),
                template.code(),
                template.name(),
                template.category(),
                template.coverImageUrl(),
                schema.description(),
                schema.badge(),
                schema.mood(),
                schema.spotlight(),
                schema.previewVariant(),
                new TemplateStyleSettingsResponse(
                        settings.layoutPreset(),
                        settings.accentTone(),
                        settings.fontFamily(),
                        settings.titleStyle(),
                        settings.bodyFontSize(),
                        settings.lineHeight(),
                        settings.pagePadding(),
                        settings.sectionSpacing()),
                template.favorited());
    }
}
