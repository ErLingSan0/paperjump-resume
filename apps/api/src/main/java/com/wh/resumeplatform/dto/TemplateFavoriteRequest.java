package com.wh.resumeplatform.dto;

import jakarta.validation.constraints.NotNull;

public record TemplateFavoriteRequest(
        @NotNull(message = "缺少收藏状态")
        Boolean favorited) {
}
