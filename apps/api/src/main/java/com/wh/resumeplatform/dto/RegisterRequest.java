package com.wh.resumeplatform.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "请输入邮箱")
        @Email(message = "邮箱格式不正确")
        @Size(max = 128, message = "邮箱长度不能超过 128 个字符")
        String email,
        @NotBlank(message = "请输入昵称")
        @Size(max = 64, message = "昵称长度不能超过 64 个字符")
        String displayName,
        @NotBlank(message = "请输入密码")
        @Size(min = 6, max = 72, message = "密码长度需要在 6 到 72 个字符之间")
        String password) {
}
