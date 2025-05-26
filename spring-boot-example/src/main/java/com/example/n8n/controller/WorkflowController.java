package com.example.n8n.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class WorkflowController {

    @GetMapping("/api/health")
    public String health() {
        return "ok";
    }
}
