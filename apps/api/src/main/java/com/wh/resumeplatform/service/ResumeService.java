package com.wh.resumeplatform.service;

import java.util.List;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wh.resumeplatform.auth.AuthenticatedUser;
import com.wh.resumeplatform.common.ApiException;
import com.wh.resumeplatform.dto.ResumeDetailResponse;
import com.wh.resumeplatform.dto.ResumeSaveRequest;
import com.wh.resumeplatform.dto.ResumeSummaryResponse;
import com.wh.resumeplatform.model.ResumeDocument;
import com.wh.resumeplatform.repository.ResumeRepository;

@Service
public class ResumeService {

    private static final Set<String> ALLOWED_STATUS = Set.of("draft", "published");
    private static final Set<String> ALLOWED_VISIBILITY = Set.of("private", "public");

    private final ResumeRepository resumeRepository;
    private final TemplateService templateService;
    private final ObjectMapper objectMapper;

    public ResumeService(
            ResumeRepository resumeRepository,
            TemplateService templateService,
            ObjectMapper objectMapper) {
        this.resumeRepository = resumeRepository;
        this.templateService = templateService;
        this.objectMapper = objectMapper;
    }

    public List<ResumeSummaryResponse> listResumes(AuthenticatedUser user) {
        return resumeRepository.findByUserId(user.id()).stream()
                .map(this::toSummaryResponse)
                .toList();
    }

    public ResumeDetailResponse getResume(Long resumeId, AuthenticatedUser user) {
        ResumeDocument resume = resumeRepository.findByIdAndUserId(resumeId, user.id())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "简历不存在"));
        return toDetailResponse(resume);
    }

    public ResumeDetailResponse createResume(ResumeSaveRequest request, AuthenticatedUser user) {
        templateService.ensureTemplateExists(request.templateId());
        ResumeDocument resume = resumeRepository.create(
                user.id(),
                request.templateId(),
                normalizeTitle(request.title(), request.content()),
                normalizeStatus(request.status()),
                normalizeVisibility(request.visibility()),
                serializeContent(request.content()));
        return toDetailResponse(resume);
    }

    public ResumeDetailResponse updateResume(Long resumeId, ResumeSaveRequest request, AuthenticatedUser user) {
        resumeRepository.findByIdAndUserId(resumeId, user.id())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "简历不存在"));
        templateService.ensureTemplateExists(request.templateId());

        ResumeDocument resume = resumeRepository.update(
                resumeId,
                user.id(),
                request.templateId(),
                normalizeTitle(request.title(), request.content()),
                normalizeStatus(request.status()),
                normalizeVisibility(request.visibility()),
                serializeContent(request.content()));
        return toDetailResponse(resume);
    }

    public void deleteResume(Long resumeId, AuthenticatedUser user) {
        resumeRepository.findByIdAndUserId(resumeId, user.id())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "简历不存在"));
        resumeRepository.delete(resumeId, user.id());
    }

    private ResumeSummaryResponse toSummaryResponse(ResumeDocument resume) {
        JsonNode content = readContent(resume.contentJson());
        String headline = content.path("profile").path("headline").asText("").trim();
        return new ResumeSummaryResponse(
                resume.id(),
                resume.title(),
                headline,
                resume.templateId(),
                resume.templateName(),
                resume.status(),
                resume.visibility(),
                resume.updatedAt());
    }

    private ResumeDetailResponse toDetailResponse(ResumeDocument resume) {
        return new ResumeDetailResponse(
                resume.id(),
                resume.title(),
                resume.templateId(),
                resume.templateName(),
                resume.status(),
                resume.visibility(),
                resume.createdAt(),
                resume.updatedAt(),
                readContent(resume.contentJson()));
    }

    private String normalizeTitle(String title, JsonNode content) {
        String normalized = title == null ? "" : title.trim();
        if (!normalized.isBlank()) {
            return truncate(normalized, 128);
        }

        String fullName = content.path("profile").path("fullName").asText("").trim();
        if (!fullName.isBlank()) {
            return truncate(fullName + " 的简历", 128);
        }

        return "未命名简历";
    }

    private String normalizeStatus(String status) {
        String normalized = status == null || status.isBlank() ? "draft" : status.trim().toLowerCase();
        if (!ALLOWED_STATUS.contains(normalized)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "不支持的简历状态");
        }
        return normalized;
    }

    private String normalizeVisibility(String visibility) {
        String normalized = visibility == null || visibility.isBlank() ? "private" : visibility.trim().toLowerCase();
        if (!ALLOWED_VISIBILITY.contains(normalized)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "不支持的简历可见性");
        }
        return normalized;
    }

    private String serializeContent(JsonNode content) {
        try {
            return objectMapper.writeValueAsString(content);
        } catch (Exception exception) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "简历内容格式不正确");
        }
    }

    private JsonNode readContent(String contentJson) {
        try {
            return objectMapper.readTree(contentJson);
        } catch (Exception exception) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "简历内容解析失败");
        }
    }

    private String truncate(String value, int maxLength) {
        return value.length() <= maxLength ? value : value.substring(0, maxLength);
    }
}
