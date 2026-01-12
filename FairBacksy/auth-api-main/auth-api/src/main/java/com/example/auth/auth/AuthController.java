package com.example.auth.auth;

import com.example.auth.auth.dto.LoginRequest;
import com.example.auth.auth.dto.RegisterRequest;
import com.example.auth.auth.dto.RegisterResponse;
import com.example.auth.auth.dto.TokenResponse;
import com.example.auth.auth.dto.ExchangeCodeRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/public/api")
public class AuthController {
    private static final Logger log = LoggerFactory.getLogger(AuthController.class);
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public RegisterResponse register(@Valid @RequestBody RegisterRequest request) {
        log.info("Register endpoint called: email={}, fullName={}", request.email(), request.fullName());
        RegisterResponse response = authService.register(request);
        log.info("Register response: message={}, email={}", response.message(), response.email());
        return response;
    }

    @PostMapping("/login")
    public TokenResponse login(@Valid @RequestBody LoginRequest request) {
        log.info("Login endpoint called: email={}", request.email());
        TokenResponse response = authService.login(request);
        log.info("Login response: accessToken length={}, expiresIn={}, refreshToken present={}",
                response.accessToken().length(), response.expiresIn(), response.refreshToken() != null);
        return response;
    }

    @PostMapping("/exchange-code")
    public TokenResponse exchangeCode(@Valid @RequestBody ExchangeCodeRequest request) {
        log.info("Exchange code endpoint called");
        TokenResponse response = authService.exchangeCode(request);
        log.info("Exchange code response: accessToken length={}, expiresIn={}, refreshToken present={}",
                response.accessToken().length(), response.expiresIn(), response.refreshToken() != null);
        return response;
    }
}
