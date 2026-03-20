package com.wh.resumeplatform.dto;

import com.fasterxml.jackson.databind.JsonNode;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ResumeSaveRequest(
        @Size(max = 128, message = "简历标题长度不能超过 128 个字符")
        String title,
        Long templateId,
        String status,
        String visibility,
        @NotNull(message = "缺少简历内容")
        JsonNode content) {
}
