package com.example.auth.forms;

import org.springframework.data.jpa.repository.*;

import java.util.*;

public interface FormTemplateRepository extends JpaRepository<FormTemplate, UUID> {
    Optional<FormTemplate> findByCode(String code);
}