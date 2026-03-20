package com.wh.resumeplatform.auth;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.util.WebUtils;

import com.wh.resumeplatform.repository.UserAccountRepository;
import com.wh.resumeplatform.service.SessionService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class AuthInterceptor implements HandlerInterceptor {

    private final SessionService sessionService;
    private final UserAccountRepository userAccountRepository;

    public AuthInterceptor(SessionService sessionService, UserAccountRepository userAccountRepository) {
        this.sessionService = sessionService;
        this.userAccountRepository = userAccountRepository;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        var cookie = WebUtils.getCookie(request, AuthCookieSupport.COOKIE_NAME);
        if (cookie == null || cookie.getValue() == null || cookie.getValue().isBlank()) {
            return true;
        }

        sessionService.resolveUserId(cookie.getValue())
                .flatMap(userAccountRepository::findById)
                .filter(user -> "active".equalsIgnoreCase(user.status()))
                .map(user -> new AuthenticatedUser(user.id(), user.email(), user.displayName(), user.role()))
                .ifPresent(user -> RequestAuthContext.set(request, user));
        return true;
    }
}
