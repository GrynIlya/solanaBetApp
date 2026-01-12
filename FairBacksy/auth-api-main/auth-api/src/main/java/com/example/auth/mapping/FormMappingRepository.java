package com.example.auth.mapping;

import org.springframework.data.jpa.repository.*;

import java.util.*;

public interface FormMappingRepository extends JpaRepository<FormMapping, UUID> {
    List<FormMapping> findByFormCode(String formCode);
}