package com.secureone.auth.web;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/** Post-login landing for browser sessions (form login redirects here by default). */
@Controller
public class HomeController {

    @GetMapping("/")
    public String home() {
        return "redirect:/login.html?signedIn=1";
    }
}
