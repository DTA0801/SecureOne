package com.secureone.auth.web;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Lightweight public info endpoint (handy for smoke checks and uptime probes). */
@Tag(name = "System", description = "Health and discovery")
@RestController
@RequestMapping("/api")
public class InfoController {

    private final String adminWebUrl;

    public InfoController(@Value("${secureone.admin-web-url:http://localhost:3001}") String adminWebUrl) {
        this.adminWebUrl = adminWebUrl.endsWith("/") ? adminWebUrl.substring(0, adminWebUrl.length() - 1) : adminWebUrl;
    }

    @Operation(summary = "Service info", description = "Public metadata including links to OpenAPI documentation.")
    @GetMapping("/info")
    public Map<String, Object> info() {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("name", "SecureOne Auth Server");
        out.put("status", "UP");
        out.put("version", "0.0.1-SNAPSHOT");
        out.put("openapi", "/v3/api-docs");
        out.put("swaggerUi", "/swagger-ui/index.html");
        out.put("docs", "/docs");
        out.put("confluence", adminWebUrl + "/confluence");
        out.put("confluenceApi", adminWebUrl + "/api/confluence");
        out.put("confluenceDiscovery", "/api/v1/confluence");
        return out;
    }
}
