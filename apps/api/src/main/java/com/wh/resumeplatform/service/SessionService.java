package com.wh.resumeplatform.service;

import java.security.SecureRandom;
import java.time.Duration;
import java.util.Base64;
import java.util.Optional;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
public class SessionService {

    private static final Duration SESSION_TTL = Duration.ofDays(30);
    private static final String SESSION_KEY_PREFIX = "auth:session:";

    private final StringRedisTemplate redisTemplate;
    private final SecureRandom secureRandom = new SecureRandom();

    public SessionService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public String createSession(Long userId) {
        byte[] bytes = new byte[24];
        secureRandom.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        redisTemplate.opsForValue().set(sessionKey(token), String.valueOf(userId), SESSION_TTL);
        return token;
    }

    public Optional<Long> resolveUserId(String token) {
        String value = redisTemplate.opsForValue().get(sessionKey(token));
        if (value == null || value.isBlank()) {
            return Optional.empty();
        }

        redisTemplate.expire(sessionKey(token), SESSION_TTL);
        return Optional.of(Long.parseLong(value));
    }

    public void destroySession(String token) {
        redisTemplate.delete(sessionKey(token));
    }

    private String sessionKey(String token) {
        return SESSION_KEY_PREFIX + token;
    }
}
