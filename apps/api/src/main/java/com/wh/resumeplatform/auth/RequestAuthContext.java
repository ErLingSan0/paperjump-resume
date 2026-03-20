package com.wh.resumeplatform.auth;

import java.util.Optional;

import org.springframework.http.HttpStatus;

import com.wh.resumeplatform.common.ApiException;

import jakarta.servlet.http.HttpServletRequest;

public final class RequestAuthContext {

    private static final String ATTRIBUTE_NAME = RequestAuthContext.class.getName() + ".authenticatedUser";

    private RequestAuthContext() {
    }

    public static void set(HttpServletRequest request, AuthenticatedUser user) {
        request.setAttribute(ATTRIBUTE_NAME, user);
    }

    public static Optional<AuthenticatedUser> get(HttpServletRequest request) {
        Object value = request.getAttribute(ATTRIBUTE_NAME);
        if (value instanceof AuthenticatedUser authenticatedUser) {
            return Optional.of(authenticatedUser);
        }
        return Optional.empty();
    }

    public static AuthenticatedUser require(HttpServletRequest request) {
        return get(request).orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "请先登录后再继续"));
    }
}
