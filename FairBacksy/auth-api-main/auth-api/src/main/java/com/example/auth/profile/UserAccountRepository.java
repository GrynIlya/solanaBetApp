package com.example.auth.profile;

import org.springframework.data.jpa.repository.*;

import java.util.*;

public interface UserAccountRepository extends JpaRepository<UserAccount, UUID> {
    Optional<UserAccount> findByKeycloakUserId(String keycloakUserId);
    Optional<UserAccount> findByEmail(String email);
}