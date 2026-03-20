package com.wh.resumeplatform.service;

import java.util.Locale;
import java.util.Optional;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.util.WebUtils;

import com.wh.resumeplatform.auth.AuthCookieSupport;
import com.wh.resumeplatform.auth.RequestAuthContext;
import com.wh.resumeplatform.common.ApiException;
import com.wh.resumeplatform.dto.CurrentUserResponse;
import com.wh.resumeplatform.dto.LoginRequest;
import com.wh.resumeplatform.dto.RegisterRequest;
import com.wh.resumeplatform.model.UserAccount;
import com.wh.resumeplatform.repository.UserAccountRepository;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Service
public class AuthService {

    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;
    private final SessionService sessionService;
    private final AuthCookieSupport authCookieSupport;

    public AuthService(
            UserAccountRepository userAccountRepository,
            PasswordEncoder passwordEncoder,
            SessionService sessionService,
            AuthCookieSupport authCookieSupport) {
        this.userAccountRepository = userAccountRepository;
        this.passwordEncoder = passwordEncoder;
        this.sessionService = sessionService;
        this.authCookieSupport = authCookieSupport;
    }

    public CurrentUserResponse register(RegisterRequest request, HttpServletRequest servletRequest, HttpServletResponse servletResponse) {
        String email = normalizeEmail(request.email());
        String displayName = request.displayName().trim();

        try {
            UserAccount user = userAccountRepository.create(
                    email,
                    displayName,
                    passwordEncoder.encode(request.password()),
                    "user",
                    "active");
            writeLoginCookie(user.id(), servletRequest, servletResponse);
            return toCurrentUserResponse(user);
        } catch (DuplicateKeyException exception) {
            throw new ApiException(HttpStatus.CONFLICT, "该邮箱已经注册过了");
        }
    }

    public CurrentUserResponse login(LoginRequest request, HttpServletRequest servletRequest, HttpServletResponse servletResponse) {
        UserAccount user = userAccountRepository.findByEmail(normalizeEmail(request.email()))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "邮箱或密码不正确"));

        if (!"active".equalsIgnoreCase(user.status())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "当前账号不可用，请联系管理员");
        }

        if (!passwordEncoder.matches(request.password(), user.passwordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "邮箱或密码不正确");
        }

        userAccountRepository.updateLastLoginAt(user.id());
        writeLoginCookie(user.id(), servletRequest, servletResponse);
        return toCurrentUserResponse(user);
    }

    public CurrentUserResponse currentUser(HttpServletRequest servletRequest) {
        return toCurrentUserResponse(userAccountRepository.findById(RequestAuthContext.require(servletRequest).id())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "登录状态已失效，请重新登录")));
    }

    public Optional<CurrentUserResponse> currentSessionUser(HttpServletRequest servletRequest) {
        return RequestAuthContext.get(servletRequest)
                .flatMap(user -> userAccountRepository.findById(user.id()))
                .map(this::toCurrentUserResponse);
    }

    public void logout(HttpServletRequest servletRequest, HttpServletResponse servletResponse) {
        var cookie = WebUtils.getCookie(servletRequest, AuthCookieSupport.COOKIE_NAME);
        if (cookie != null && cookie.getValue() != null && !cookie.getValue().isBlank()) {
            sessionService.destroySession(cookie.getValue());
        }
        authCookieSupport.clearSessionCookie(servletResponse, servletRequest.isSecure());
    }

    private void writeLoginCookie(Long userId, HttpServletRequest servletRequest, HttpServletResponse servletResponse) {
        String sessionToken = sessionService.createSession(userId);
        authCookieSupport.writeSessionCookie(servletResponse, sessionToken, servletRequest.isSecure());
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private CurrentUserResponse toCurrentUserResponse(UserAccount user) {
        return new CurrentUserResponse(user.id(), user.email(), user.displayName(), user.role());
    }
}
