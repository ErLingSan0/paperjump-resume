package com.wh.resumeplatform.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @NotBlank(message = "请输入邮箱")
        @Email(message = "邮箱格式不正确")
        @Size(max = 128, message = "邮箱长度不能超过 128 个字符")
        String email,
        @NotBlank(message = "请输入密码")
        @Size(max = 72, message = "密码长度不能超过 72 个字符")
        String password) {
}
