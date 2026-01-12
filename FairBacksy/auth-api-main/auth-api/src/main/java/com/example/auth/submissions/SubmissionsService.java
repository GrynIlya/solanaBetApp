package com.example.auth.submissions;

import com.example.auth.forms.*;
import com.example.auth.mapping.*;
import com.example.auth.profile.*;
import org.springframework.stereotype.*;
import org.springframework.transaction.annotation.*;

import java.util.*;

@Service
public class SubmissionsService {
    private final FormSubmissionRepository repo;
    private final FormTemplateRepository forms;
    private final FormMappingRepository mapping;
    private final UserAccountRepository users;

    public SubmissionsService(FormSubmissionRepository r, FormTemplateRepository f, FormMappingRepository m, UserAccountRepository u) {
        this.repo = r;
        this.forms = f;
        this.mapping = m;
        this.users = u;
    }

    @Transactional
    public FormSubmission createDraft(String userSub, String formCode) {
        forms.findByCode(formCode).orElseThrow(() -> new IllegalArgumentException("Form not found: " + formCode));
        var s = new FormSubmission();
        s.setUserSub(userSub);
        s.setFormCode(formCode);
        s.setStatus("DRAFT");
        s.setPayload("{}");
        return repo.save(s);
    }

    @Transactional
    public FormSubmission updatePayload(UUID id, String userSub, String payload) {
        var s = repo.findById(id).orElseThrow();
        if (!s.getUserSub().equals(userSub)) throw new IllegalArgumentException("Forbidden");
        s.setPayload(payload != null ? payload : "{}");
        return s;
    }

    @Transactional
    public FormSubmission submit(UUID id, String userSub) {
        var s = repo.findById(id).orElseThrow();
        if (!s.getUserSub().equals(userSub)) throw new IllegalArgumentException("Forbidden");
        s.setStatus("SUBMITTED");
        return s;
    }

    @Transactional
    public FormSubmission autofill(UUID id, String userSub) {
        var s = repo.findById(id).orElseThrow();
        if (!s.getUserSub().equals(userSub)) throw new IllegalArgumentException("Forbidden");
        var maps = mapping.findByFormCode(s.getFormCode());
        var ua = users.findByKeycloakUserId(userSub).orElse(null);
        try {
            com.fasterxml.jackson.databind.ObjectMapper om = new com.fasterxml.jackson.databind.ObjectMapper();
            Map<String, Object> p = om.readValue(s.getPayload() == null ? "{}" : s.getPayload(), Map.class);
            for (var m : maps) {
                Object v = null;
                if (ua != null && m.getSource().startsWith("profile.")) {
                    String src = m.getSource().substring("profile.".length());
                    if ("fullName".equals(src)) v = ua.getFullName();
                    if ("phone".equals(src)) v = ua.getPhone();
                }
                if (v != null) {
                    p.put(m.getFieldPath(), v);
                }
            }
            s.setPayload(om.writeValueAsString(p));
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        return s;
    }
}