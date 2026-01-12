package com.example.auth.auth.dto;

public record TokenResponse(String accessToken, int expiresIn, String refreshToken) {}
