package com.example.auth.mapping;

import jakarta.persistence.*;

import java.util.*;

@Entity
@Table(name = "form_mapping", uniqueConstraints = @UniqueConstraint(columnNames = {"form_code", "field_path"}))
public class FormMapping {
    @Id
    @GeneratedValue
    private UUID id;
    @Column(name = "form_code", nullable = false, length = 64)
    private String formCode;
    @Column(name = "field_path", nullable = false, length = 255)
    private String fieldPath;
    @Column(nullable = false, length = 64)
    private String source;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getFormCode() {
        return formCode;
    }

    public void setFormCode(String f) {
        this.formCode = f;
    }

    public String getFieldPath() {
        return fieldPath;
    }

    public void setFieldPath(String p) {
        this.fieldPath = p;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String s) {
        this.source = s;
    }
}