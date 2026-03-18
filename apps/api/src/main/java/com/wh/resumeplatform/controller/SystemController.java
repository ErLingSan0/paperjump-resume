package com.wh.resumeplatform.controller;

import java.time.Instant;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.wh.resumeplatform.dto.SystemInfoResponse;

@RestController
@RequestMapping("/api/system")
public class SystemController {

    private final Environment environment;

    @Value("${spring.application.name}")
    private String applicationName;

    @Value("${app.version:0.0.1-SNAPSHOT}")
    private String appVersion;

    public SystemController(Environment environment) {
        this.environment = environment;
    }

    @GetMapping("/info")
    public SystemInfoResponse info() {
        String[] activeProfiles = environment.getActiveProfiles();
        String currentProfile = activeProfiles.length == 0 ? "local" : activeProfiles[0];
        return new SystemInfoResponse(
                applicationName,
                currentProfile,
                appVersion,
                Instant.now());
    }
}
