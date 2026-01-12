package com.example.auth.profile;

import org.springframework.stereotype.*;
import org.springframework.transaction.annotation.*;

@Service
public class ProfileService {
    private final UserAccountRepository repo;

    public ProfileService(UserAccountRepository repo) {
        this.repo = repo;
    }

    @Transactional
    public UserAccount upsert(String sub, String email, String fullName, String phone) {
        return repo.findByKeycloakUserId(sub).map(u -> {
            if (fullName != null) u.setFullName(fullName);
            if (phone != null) u.setPhone(phone);
            if (email != null) u.setEmail(email);
            return u;
        }).orElseGet(() -> {
            var u = new UserAccount();
            u.setKeycloakUserId(sub);
            u.setEmail(email);
            u.setFullName(fullName);
            u.setPhone(phone);
            return repo.save(u);
        });
    }

    @Transactional(readOnly = true)
    public UserAccount getOrCreate(String sub, String email) {
        return repo.findByKeycloakUserId(sub).orElseGet(() -> {
            var u = new UserAccount();
            u.setKeycloakUserId(sub);
            u.setEmail(email);
            return repo.save(u);
        });
    }
}