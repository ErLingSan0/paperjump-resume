package com.wh.resumeplatform.auth;

public record AuthenticatedUser(
        Long id,
        String email,
        String displayName,
        String role) {
}
