package com.wh.resumeplatform.model;

import java.time.Instant;

public record UserAccount(
        Long id,
        String email,
        String displayName,
        String passwordHash,
        String role,
        String status,
        Instant createdAt,
        Instant updatedAt,
        Instant lastLoginAt) {
}
