package com.example.auth.mapping;

import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/mapping")
public class MappingController {
    private final FormMappingRepository repo;

    public MappingController(FormMappingRepository r) {
        this.repo = r;
    }

    @GetMapping("/{formCode}")
    public List<Map<String, String>> list(@PathVariable String formCode) {
        return repo.findByFormCode(formCode).stream().map(m -> Map.of("fieldPath", m.getFieldPath(), "source", m.getSource())).toList();
    }

    @PostMapping("/upsert")
    public Map<String, Object> upsert(@RequestBody MappingUpsertDto dto) {
        var ex = repo.findByFormCode(dto.formCode()).stream().filter(m -> m.getFieldPath().equals(dto.fieldPath())).findFirst().orElse(null);
        if (ex != null) {
            ex.setSource(dto.source());
            repo.save(ex);
            return Map.of("ok", true, "updated", true);
        }
        var m = new FormMapping();
        m.setFormCode(dto.formCode());
        m.setFieldPath(dto.fieldPath());
        m.setSource(dto.source());
        repo.save(m);
        return Map.of("ok", true, "created", true);
    }
}