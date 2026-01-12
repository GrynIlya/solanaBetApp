package com.example.auth.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record ExchangeCodeRequest(@NotBlank String code, @NotBlank String codeVerifier) {}
