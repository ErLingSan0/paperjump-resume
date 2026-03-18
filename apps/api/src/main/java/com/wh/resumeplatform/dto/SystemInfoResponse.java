package com.wh.resumeplatform.dto;

import java.time.Instant;

public record SystemInfoResponse(
        String application,
        String environment,
        String version,
        Instant serverTime) {
}
