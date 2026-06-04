package com.secureone.auth.web;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/** Convenience entry point for interactive API documentation. */
@Controller
public class DocsRedirectController {

    @GetMapping({"/docs", "/docs/"})
    public String swaggerUi() {
        return "redirect:/swagger-ui/index.html?urls.primaryName=All%20APIs";
    }
}
