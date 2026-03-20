package com.wh.resumeplatform.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.wh.resumeplatform.dto.CurrentUserResponse;
import com.wh.resumeplatform.dto.LoginRequest;
import com.wh.resumeplatform.dto.RegisterRequest;
import com.wh.resumeplatform.service.AuthService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;

@Validated
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public CurrentUserResponse register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest servletRequest,
            HttpServletResponse servletResponse) {
        return authService.register(request, servletRequest, servletResponse);
    }

    @PostMapping("/login")
    public CurrentUserResponse login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest servletRequest,
            HttpServletResponse servletResponse) {
        return authService.login(request, servletRequest, servletResponse);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest servletRequest, HttpServletResponse servletResponse) {
        authService.logout(servletRequest, servletResponse);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public CurrentUserResponse me(HttpServletRequest servletRequest) {
        return authService.currentUser(servletRequest);
    }

    @GetMapping("/session")
    public ResponseEntity<CurrentUserResponse> session(HttpServletRequest servletRequest) {
        return ResponseEntity.ok(authService.currentSessionUser(servletRequest).orElse(null));
    }
}
