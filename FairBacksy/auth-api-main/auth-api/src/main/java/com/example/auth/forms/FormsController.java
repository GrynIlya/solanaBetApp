package com.example.auth.forms;

import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/forms")
public class FormsController {
    private final FormsService service;

    public FormsController(FormsService s) {
        this.service = s;
    }

    @GetMapping
    public List<Map<String, Object>> list() {
        return service.list().stream().map(f -> Map.<String, Object>of("code", f.getCode(), "title", f.getTitle(), "version", f.getVersion())).toList();
    }

    @GetMapping("/{code}")
    public Map<String, Object> get(@PathVariable String code) {
        var f = service.getByCode(code);
        return Map.<String, Object>of("code", f.getCode(), "title", f.getTitle(), "version", f.getVersion(), "jsonSchema", f.getJsonSchema());
    }

    @PostMapping("/upsert")
    public Map<String, Object> upsert(@RequestBody FormUpsertDto dto) {
        var f = service.upsert(dto.code(), dto.title(), dto.version(), dto.jsonSchema());
        return Map.<String, Object>of("ok", true, "code", f.getCode(), "version", f.getVersion());
    }
}