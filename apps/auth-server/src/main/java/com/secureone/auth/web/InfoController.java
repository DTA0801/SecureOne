package com.secureone.auth.web;

import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Lightweight public info endpoint (handy for smoke checks and uptime probes). */
@RestController
@RequestMapping("/api")
public class InfoController {

    @GetMapping("/info")
    public Map<String, Object> info() {
        return Map.of(
                "name", "SecureOne Auth Server",
                "status", "UP",
                "version", "0.0.1-SNAPSHOT");
    }
}
