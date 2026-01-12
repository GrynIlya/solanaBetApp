package com.example.auth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.annotation.*;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
public class MeController {
    private static final Logger log = LoggerFactory.getLogger(MeController.class);

    @GetMapping("/public/ping")
    public Map<String, String> ping() {
        log.info("Ping endpoint called");
        return Map.of("status", "ok");
    }

    @GetMapping("/me")
    public Map<String, Object> me(@AuthenticationPrincipal Jwt jwt) {
        log.info("Me endpoint called: sub={}, email={}", jwt.getSubject(), jwt.getClaimAsString("email"));
        Map<String, Object> result = new HashMap<>();
        result.put("sub", jwt.getSubject());
        result.put("email", jwt.getClaimAsString("email"));
        result.put("roles", jwt.getClaim("realm_access"));
        log.info("Me response: {}", result);
        return result;
    }

    @GetMapping("/admin/health")
    public Map<String, String> adminOnly() {
        log.info("Admin health endpoint called");
        return Map.of("scope", "admin");
    }
}