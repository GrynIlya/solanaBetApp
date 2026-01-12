package com.example.auth.submissions;

import org.springframework.data.jpa.repository.*;

import java.util.*;

public interface FormSubmissionRepository extends JpaRepository<FormSubmission, UUID> {
    List<FormSubmission> findByUserSub(String userSub);
}