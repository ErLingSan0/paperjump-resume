package com.wh.resumeplatform.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.wh.resumeplatform.auth.RequestAuthContext;
import com.wh.resumeplatform.dto.TemplateFavoriteRequest;
import com.wh.resumeplatform.dto.TemplateResponse;
import com.wh.resumeplatform.service.TemplateService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@Validated
@RestController
@RequestMapping("/api/templates")
public class TemplateController {

    private final TemplateService templateService;

    public TemplateController(TemplateService templateService) {
        this.templateService = templateService;
    }

    @GetMapping
    public List<TemplateResponse> list(HttpServletRequest servletRequest) {
        return templateService.listTemplates(RequestAuthContext.get(servletRequest).orElse(null));
    }

    @PutMapping("/{templateId}/favorite")
    public ResponseEntity<Void> setFavorite(
            @PathVariable("templateId") Long templateId,
            @Valid @RequestBody TemplateFavoriteRequest request,
            HttpServletRequest servletRequest) {
        templateService.setFavorite(templateId, request.favorited(), RequestAuthContext.require(servletRequest));
        return ResponseEntity.noContent().build();
    }
}
