package com.example.auth.forms;

import jakarta.persistence.*;

import java.time.*;
import java.util.*;

@Entity
@Table(name = "form_template")
public class FormTemplate {
    @Id
    @GeneratedValue
    private UUID id;
    @Column(nullable = false, unique = true, length = 64)
    private String code;
    @Column(nullable = false, length = 255)
    private String title;
    @Column(nullable = false, length = 32)
    private String version;
    @Column(name = "json_schema", columnDefinition = "jsonb", nullable = false)
    private String jsonSchema;
    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String t) {
        this.title = t;
    }

    public String getVersion() {
        return version;
    }

    public void setVersion(String v) {
        this.version = v;
    }

    public String getJsonSchema() {
        return jsonSchema;
    }

    public void setJsonSchema(String j) {
        this.jsonSchema = j;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime t) {
        this.createdAt = t;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(OffsetDateTime t) {
        this.updatedAt = t;
    }
}