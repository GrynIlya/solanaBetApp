package com.example.auth.profile;

import jakarta.persistence.*;

import java.time.*;
import java.util.*;

@Entity
@Table(name = "user_account")
public class UserAccount {
    @Id
    @GeneratedValue
    private UUID id;
    @Column(name = "keycloak_user_id", nullable = false, unique = true)
    private String keycloakUserId;
    @Column(nullable = false, length = 320)
    private String email;
    @Column(name = "full_name", length = 255)
    private String fullName;
    @Column(length = 64)
    private String phone;
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

    public String getKeycloakUserId() {
        return keycloakUserId;
    }

    public void setKeycloakUserId(String s) {
        this.keycloakUserId = s;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String e) {
        this.email = e;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String n) {
        this.fullName = n;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String p) {
        this.phone = p;
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