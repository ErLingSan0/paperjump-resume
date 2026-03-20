package com.wh.resumeplatform.common;

import java.time.Instant;

public record ApiErrorResponse(
        String message,
        Instant timestamp) {
}
