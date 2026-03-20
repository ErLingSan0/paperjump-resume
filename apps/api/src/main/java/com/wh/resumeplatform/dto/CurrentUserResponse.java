package com.wh.resumeplatform.dto;

public record CurrentUserResponse(
        Long id,
        String email,
        String displayName,
        String role) {
}
