package com.example.auth.submissions;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.*;
import java.util.*;

@Entity
@Table(name = "form_submission")
public class FormSubmission {
    @Id
    @GeneratedValue
    private UUID id;
    @Column(name = "user_sub", nullable = false, length = 255)
    private String userSub;
    @Column(name = "form_code", nullable = false, length = 64)
    private String formCode;
    @Column(nullable = false, length = 16)
    private String status;
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private String payload;
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

    public String getUserSub() {
        return userSub;
    }

    public void setUserSub(String u) {
        this.userSub = u;
    }

    public String getFormCode() {
        return formCode;
    }

    public void setFormCode(String f) {
        this.formCode = f;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String s) {
        this.status = s;
    }

    public String getPayload() {
        return payload;
    }

    public void setPayload(String p) {
        this.payload = p;
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