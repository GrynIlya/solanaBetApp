package com.example.auth.forms;

import org.springframework.stereotype.*;
import org.springframework.transaction.annotation.*;

import java.util.*;

@Service
public class FormsService {
    private final FormTemplateRepository repo;

    public FormsService(FormTemplateRepository r) {
        this.repo = r;
    }

    @Transactional(readOnly = true)
    public List<FormTemplate> list() {
        return repo.findAll();
    }

    @Transactional(readOnly = true)
    public FormTemplate getByCode(String code) {
        return repo.findByCode(code).orElseThrow(() -> new IllegalArgumentException("Form not found: " + code));
    }

    @Transactional
    public FormTemplate upsert(String code, String title, String version, String jsonSchema) {
        return repo.findByCode(code).map(f -> {
            f.setTitle(title);
            f.setVersion(version);
            f.setJsonSchema(jsonSchema);
            return f;
        }).orElseGet(() -> {
            var f = new FormTemplate();
            f.setCode(code);
            f.setTitle(title);
            f.setVersion(version);
            f.setJsonSchema(jsonSchema);
            return repo.save(f);
        });
    }
}