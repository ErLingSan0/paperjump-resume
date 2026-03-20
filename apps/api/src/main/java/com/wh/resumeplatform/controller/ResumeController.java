package com.wh.resumeplatform.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.wh.resumeplatform.auth.RequestAuthContext;
import com.wh.resumeplatform.dto.ResumeDetailResponse;
import com.wh.resumeplatform.dto.ResumeSaveRequest;
import com.wh.resumeplatform.dto.ResumeSummaryResponse;
import com.wh.resumeplatform.service.ResumeService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@Validated
@RestController
@RequestMapping("/api/resumes")
public class ResumeController {

    private final ResumeService resumeService;

    public ResumeController(ResumeService resumeService) {
        this.resumeService = resumeService;
    }

    @GetMapping
    public List<ResumeSummaryResponse> list(HttpServletRequest servletRequest) {
        return resumeService.listResumes(RequestAuthContext.require(servletRequest));
    }

    @GetMapping("/{resumeId}")
    public ResumeDetailResponse detail(@PathVariable("resumeId") Long resumeId, HttpServletRequest servletRequest) {
        return resumeService.getResume(resumeId, RequestAuthContext.require(servletRequest));
    }

    @PostMapping
    public ResumeDetailResponse create(
            @Valid @RequestBody ResumeSaveRequest request,
            HttpServletRequest servletRequest) {
        return resumeService.createResume(request, RequestAuthContext.require(servletRequest));
    }

    @PutMapping("/{resumeId}")
    public ResumeDetailResponse update(
            @PathVariable("resumeId") Long resumeId,
            @Valid @RequestBody ResumeSaveRequest request,
            HttpServletRequest servletRequest) {
        return resumeService.updateResume(resumeId, request, RequestAuthContext.require(servletRequest));
    }

    @DeleteMapping("/{resumeId}")
    public ResponseEntity<Void> delete(@PathVariable("resumeId") Long resumeId, HttpServletRequest servletRequest) {
        resumeService.deleteResume(resumeId, RequestAuthContext.require(servletRequest));
        return ResponseEntity.noContent().build();
    }
}
