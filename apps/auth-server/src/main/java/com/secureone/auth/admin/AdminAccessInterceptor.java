package com.secureone.auth.admin;

import com.secureone.auth.admin.role.RoleApplicationLookup;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class AdminAccessInterceptor implements HandlerInterceptor {

    private static final Pattern APP_PATH =
            Pattern.compile("^/api/admin/v1/applications/([0-9a-fA-F-]{36})(?:/|$)");
    private static final Pattern ROLE_PATH =
            Pattern.compile("^/api/admin/v1/roles/([0-9a-fA-F-]{36})$");
    private static final Pattern PERMISSION_PATH =
            Pattern.compile("^/api/admin/v1/permissions/([0-9a-fA-F-]{36})$");

    private final AdminAccessService access;
    private final RoleApplicationLookup rbacLookup;

    public AdminAccessInterceptor(AdminAccessService access, RoleApplicationLookup rbacLookup) {
        this.access = access;
        this.rbacLookup = rbacLookup;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String path = request.getRequestURI();
        if (!path.startsWith("/api/admin/v1/")) {
            return true;
        }
        if (path.startsWith("/api/admin/v1/context")) {
            return true;
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String actAs = request.getHeader("X-Act-As-Email");

        UUID applicationId = parseApplicationId(path, request);
        if (applicationId != null) {
            access.requireApplicationAccess(auth, actAs, applicationId);
        }

        if (path.startsWith("/api/admin/v1/settings")) {
            access.requireSuperAdmin(auth);
            return true;
        }

        if (path.equals("/api/admin/v1/applications") && "POST".equalsIgnoreCase(request.getMethod())) {
            access.requireSuperAdmin(auth);
        } else if (APP_PATH.matcher(path).find()
                && ("PUT".equalsIgnoreCase(request.getMethod())
                        || "DELETE".equalsIgnoreCase(request.getMethod()))) {
            access.requireSuperAdmin(auth);
        }
        return true;
    }

    private static boolean isClientManagementPath(String path) {
        return path.startsWith("/api/admin/v1/applications");
    }

    private UUID parseApplicationId(String path, HttpServletRequest request) {
        Matcher m = APP_PATH.matcher(path);
        if (m.find()) {
            return UUID.fromString(m.group(1));
        }
        String param = request.getParameter("applicationId");
        if (param != null && !param.isBlank()) {
            return UUID.fromString(param);
        }
        String header = request.getHeader("X-Application-Id");
        if (header != null && !header.isBlank()) {
            return UUID.fromString(header);
        }
        Matcher roleM = ROLE_PATH.matcher(path);
        if (roleM.find()) {
            return rbacLookup
                    .applicationIdForRole(UUID.fromString(roleM.group(1)))
                    .orElse(null);
        }
        Matcher permM = PERMISSION_PATH.matcher(path);
        if (permM.find()) {
            return rbacLookup
                    .applicationIdForPermission(UUID.fromString(permM.group(1)))
                    .orElse(null);
        }
        return null;
    }
}
