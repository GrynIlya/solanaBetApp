package com.example.auth.submissions;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.*;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.UUID;

@RestController
@RequestMapping("/submissions")
public class SubmissionsController {
    private final SubmissionsService service;

    public SubmissionsController(SubmissionsService s) {
        this.service = s;
    }

    @PostMapping
    @PreAuthorize("hasRole('user')")
    public Map<String, Object> create(@AuthenticationPrincipal Jwt jwt, @RequestBody CreateSubmissionDto dto) {
        var s = service.createDraft(jwt.getSubject(), dto.formCode());
        return Map.of("id", s.getId(), "status", s.getStatus(), "formCode", s.getFormCode(), "payload", s.getPayload());
    }

    @PutMapping("/{id}")
    public Map<String, Object> update(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id, @RequestBody UpdateSubmissionDto dto) {
        var s = service.updatePayload(id, jwt.getSubject(), dto.payload());
        return Map.of("id", s.getId(), "status", s.getStatus(), "payload", s.getPayload());
    }

    @PostMapping("/{id}/autofill")
    public Map<String, Object> autofill(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        var s = service.autofill(id, jwt.getSubject());
        return Map.of("id", s.getId(), "status", s.getStatus(), "payload", s.getPayload());
    }

    @PostMapping("/{id}/submit")
    public Map<String, Object> submit(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        var s = service.submit(id, jwt.getSubject());
        return Map.of("id", s.getId(), "status", s.getStatus());
    }
}