package com.example.auth.auth;

import com.example.auth.auth.dto.LoginRequest;
import com.example.auth.auth.dto.RegisterRequest;
import com.example.auth.auth.dto.RegisterResponse;
import com.example.auth.auth.dto.TokenResponse;
import com.example.auth.auth.dto.ExchangeCodeRequest;
import com.example.auth.profile.UserAccount;
import com.example.auth.profile.UserAccountRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@Service
public class AuthService {
    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private final KeycloakProperties properties;
    private final UserAccountRepository userAccountRepository;
    private final WebClient webClient;

    public AuthService(KeycloakProperties properties, UserAccountRepository userAccountRepository, WebClient.Builder webClientBuilder) {
        this.properties = properties;
        this.userAccountRepository = userAccountRepository;
        this.webClient = webClientBuilder.baseUrl(properties.getBaseUrl()).build();
    }

    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        log.info("Starting registration for email={}, fullName={}", request.email(), request.fullName());
        var existing = userAccountRepository.findByEmail(request.email());
        existing.ifPresent(u -> {
            log.warn("Email {} already registered", request.email());
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        });
        log.info("Email {} is available", request.email());

        log.info("Obtaining admin token");
        var adminToken = obtainAdminToken();
        log.info("Admin token obtained");

        log.info("Creating user in Keycloak: email={}, fullName={}", request.email(), request.fullName());
        var userId = createKeycloakUser(request, adminToken);
        log.info("User created in Keycloak: id={}", userId);

        log.info("Assigning role 'user' to user {}", userId);
        assignRealmRole(userId, "user", adminToken);
        log.info("Role 'user' assigned to user {}", userId);

        log.info("Saving user to api_db: keycloakUserId={}, email={}, fullName={}", userId, request.email(), request.fullName());
        var account = new UserAccount();
        account.setKeycloakUserId(userId);
        account.setEmail(request.email());
        account.setFullName(request.fullName());
        userAccountRepository.save(account);
        log.info("User saved to api_db with id {}", account.getId());

        var response = new RegisterResponse("User registered", request.email());
        log.info("Registration completed for email={}", request.email());
        return response;
    }

    public TokenResponse login(LoginRequest request) {
        log.info("Starting login for email={}", request.email());
        var body = new LinkedMultiValueMap<String, String>();
        body.add("grant_type", "password");
        body.add("client_id", properties.getLogin().getClientId());
        if (properties.getLogin().getClientSecret() != null) {
            body.add("client_secret", properties.getLogin().getClientSecret());
        }
        body.add("username", request.email());
        body.add("password", request.password());

        log.info("Requesting token from Keycloak for client {}", properties.getLogin().getClientId());
        var response = tokenRequest(body, properties.getRealm());
        var accessToken = (String) response.get("access_token");
        var expiresIn = ((Number) response.get("expires_in")).intValue();
        var refreshToken = (String) response.get("refresh_token");
        log.info("Token received: accessToken starts with '{}...', expiresIn={}, refreshToken present={}",
                accessToken.substring(0, Math.min(10, accessToken.length())), expiresIn, refreshToken != null);
        logAccessTokenPayload(accessToken);
        return new TokenResponse(accessToken, expiresIn, refreshToken);
    }

    public TokenResponse exchangeCode(ExchangeCodeRequest request) {
        log.info("Starting code exchange");
        var body = new LinkedMultiValueMap<String, String>();
        body.add("grant_type", "authorization_code");
        body.add("client_id", properties.getLogin().getClientId());
        body.add("code", request.code());
        body.add("code_verifier", request.codeVerifier());
        String redirectUri = properties.getLogin().getRedirectUri();
        log.info("Using redirect_uri from config: {}", redirectUri);
        if (redirectUri != null) {
            body.add("redirect_uri", redirectUri);
        }

        log.info("Requesting token from Keycloak for client {}", properties.getLogin().getClientId());
        var response = tokenRequest(body, properties.getRealm());
        var accessToken = (String) response.get("access_token");
        var expiresIn = ((Number) response.get("expires_in")).intValue();
        var refreshToken = (String) response.get("refresh_token");
        log.info("Token received: accessToken starts with '{}...', expiresIn={}, refreshToken present={}",
                accessToken.substring(0, Math.min(10, accessToken.length())), expiresIn, refreshToken != null);
        logAccessTokenPayload(accessToken);
        return new TokenResponse(accessToken, expiresIn, refreshToken);
    }

    private void logAccessTokenPayload(String accessToken) {
        try {
            var parts = accessToken.split("\\.");
            if (parts.length >= 2) {
                var payload = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
                log.info("Access token payload: {}", payload);
            }
        } catch (Exception ex) {
            log.warn("Failed to decode access token payload", ex);
        }
    }

    private void assignRealmRole(String userId, String role, String adminToken) {
        var roleRepresentation = webClient.get()
                .uri("/admin/realms/{realm}/roles/{role}", properties.getRealm(), role)
                .headers(h -> h.setBearerAuth(adminToken))
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .block();

        if (roleRepresentation == null) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Role not found in Keycloak: " + role);
        }

        webClient.post()
                .uri("/admin/realms/{realm}/users/{id}/role-mappings/realm", properties.getRealm(), userId)
                .headers(h -> h.setBearerAuth(adminToken))
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(List.of(roleRepresentation))
                .retrieve()
                .onStatus(status -> status.isError(), clientResponse -> clientResponse.bodyToMono(String.class)
                        .flatMap(errorBody -> Mono.error(new ResponseStatusException(clientResponse.statusCode(),
                                "Failed to assign role: " + errorBody))))
                .toBodilessEntity()
                .block();
    }

    private String createKeycloakUser(RegisterRequest request, String adminToken) {
        var payload = Map.of(
                "email", request.email(),
                "username", request.email(),
                "enabled", true,
                "emailVerified", true,
                "requiredActions", new String[]{},
                "credentials", new Object[]{Map.of(
                        "type", "password",
                        "value", request.password(),
                        "temporary", false
                )},
                "realmRoles", new String[]{"user"}
        );

        return webClient.post()
                .uri("/admin/realms/{realm}/users", properties.getRealm())
                .headers(h -> h.setBearerAuth(adminToken))
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(payload)
                .exchangeToMono(response -> {
                    if (response.statusCode().is2xxSuccessful()) {
                        return response.headers().header("Location").stream().findFirst()
                                .map(location -> location.substring(location.lastIndexOf('/') + 1))
                                .map(Mono::just)
                                .orElseGet(() -> Mono.error(new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Keycloak did not return Location header")));
                    }
                    if (response.statusCode().equals(HttpStatus.CONFLICT)) {
                        return response.bodyToMono(String.class)
                                .flatMap(errorBody -> Mono.error(new ResponseStatusException(HttpStatus.CONFLICT, "User already exists in Keycloak")));
                    }
                    return response.bodyToMono(String.class)
                            .flatMap(errorBody -> Mono.error(new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Failed to create user: " + errorBody)));
                })
                .cast(String.class)
                .block();
    }

    private String obtainAdminToken() {
        log.info("Obtaining admin token for realm {}", properties.getAdmin().getRealm());
        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "password");
        body.add("client_id", properties.getAdmin().getClientId());
        body.add("username", properties.getAdmin().getUsername());
        body.add("password", properties.getAdmin().getPassword());
        var response = tokenRequest(body, properties.getAdmin().getRealm());
        var token = (String) response.get("access_token");
        log.info("Admin token obtained, length={}", token.length());
        return token;
    }

    private Map<String, Object> tokenRequest(MultiValueMap<String, String> body, String realm) {
        log.info("Token request to realm {}, client_id={}", realm, body.get("client_id"));
        return webClient.post()
                .uri("/realms/{realm}/protocol/openid-connect/token", realm)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(BodyInserters.fromFormData(body))
                .retrieve()
                .onStatus(status -> status.isError(), clientResponse -> clientResponse.bodyToMono(String.class)
                        .flatMap(errorBody -> Mono.error(new ResponseStatusException(clientResponse.statusCode(),
                                "Token request failed: " + errorBody))))
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .block();
    }
}
