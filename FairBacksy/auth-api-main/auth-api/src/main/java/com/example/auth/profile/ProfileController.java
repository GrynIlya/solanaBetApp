package com.example.auth.profile;

import org.springframework.security.core.annotation.*;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/profile")
public class ProfileController {
    private final ProfileService service;

    public ProfileController(ProfileService s) {
        this.service = s;
    }

    @GetMapping
    public Map<String, Object> get(@AuthenticationPrincipal Jwt jwt) {
        var u = service.getOrCreate(jwt.getSubject(), jwt.getClaimAsString("email"));
        return Map.of("keycloakUserId", u.getKeycloakUserId(), "email", u.getEmail(), "fullName", u.getFullName(), "phone", u.getPhone());
    }

    @PostMapping
    public Map<String, Object> upsert(@AuthenticationPrincipal Jwt jwt, @RequestBody ProfileDto dto) {
        var u = service.upsert(jwt.getSubject(), jwt.getClaimAsString("email"), dto.fullName(), dto.phone());
        return Map.of("ok", true, "email", u.getEmail(), "fullName", u.getFullName(), "phone", u.getPhone());
    }
}