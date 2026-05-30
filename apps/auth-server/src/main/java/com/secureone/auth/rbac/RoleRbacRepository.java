package com.secureone.auth.rbac;

import java.util.ArrayDeque;
import java.util.HashSet;
import java.util.List;
import java.util.Queue;
import java.util.Set;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class RoleRbacRepository {

    private final JdbcTemplate jdbc;

    public RoleRbacRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<UUID> findPermissionIdsByRoleId(UUID roleId) {
        return jdbc.queryForList(
                "SELECT permission_id FROM role_permission WHERE role_id = ?",
                UUID.class,
                roleId);
    }

    public List<UUID> findChildRoleIdsByParentId(UUID parentRoleId) {
        return jdbc.queryForList(
                "SELECT child_role_id FROM role_composite WHERE parent_role_id = ?",
                UUID.class,
                parentRoleId);
    }

    public void replacePermissions(UUID roleId, List<UUID> permissionIds) {
        jdbc.update("DELETE FROM role_permission WHERE role_id = ?", roleId);
        for (UUID permissionId : permissionIds) {
            jdbc.update(
                    "INSERT INTO role_permission (role_id, permission_id) VALUES (?, ?) ON CONFLICT DO NOTHING",
                    roleId,
                    permissionId);
        }
    }

    public void replaceChildRoles(UUID parentRoleId, List<UUID> childRoleIds) {
        jdbc.update("DELETE FROM role_composite WHERE parent_role_id = ?", parentRoleId);
        for (UUID childId : childRoleIds) {
            if (parentRoleId.equals(childId)) {
                throw new IllegalArgumentException("A role cannot inherit itself.");
            }
            jdbc.update(
                    "INSERT INTO role_composite (parent_role_id, child_role_id) VALUES (?, ?) ON CONFLICT DO NOTHING",
                    parentRoleId,
                    childId);
        }
    }

    public int countPermissions(UUID roleId) {
        Integer count =
                jdbc.queryForObject(
                        "SELECT COUNT(*) FROM role_permission WHERE role_id = ?", Integer.class, roleId);
        return count != null ? count : 0;
    }

    public int countChildRoles(UUID parentRoleId) {
        Integer count =
                jdbc.queryForObject(
                        "SELECT COUNT(*) FROM role_composite WHERE parent_role_id = ?",
                        Integer.class,
                        parentRoleId);
        return count != null ? count : 0;
    }

    public int countRolesUsingPermission(UUID permissionId) {
        Integer count =
                jdbc.queryForObject(
                        "SELECT COUNT(DISTINCT role_id) FROM role_permission WHERE permission_id = ?",
                        Integer.class,
                        permissionId);
        return count != null ? count : 0;
    }

    public List<RoleRef> findRolesUsingPermission(UUID permissionId) {
        return jdbc.query(
                """
                SELECT r.id, r.name
                FROM role_permission rp
                JOIN role r ON r.id = rp.role_id
                WHERE rp.permission_id = ?
                ORDER BY r.name
                """,
                (rs, rowNum) -> new RoleRef(UUID.fromString(rs.getString("id")), rs.getString("name")),
                permissionId);
    }

    /** Direct + inherited permission count (follows composite child roles). */
    public int countEffectivePermissions(UUID roleId) {
        Set<UUID> permissionIds = new HashSet<>();
        Set<UUID> visitedRoles = new HashSet<>();
        collectEffectivePermissions(roleId, permissionIds, visitedRoles);
        return permissionIds.size();
    }

    private void collectEffectivePermissions(UUID roleId, Set<UUID> permissionIds, Set<UUID> visitedRoles) {
        if (!visitedRoles.add(roleId)) {
            return;
        }
        permissionIds.addAll(findPermissionIdsByRoleId(roleId));
        for (UUID childId : findChildRoleIdsByParentId(roleId)) {
            collectEffectivePermissions(childId, permissionIds, visitedRoles);
        }
    }

    /** True if assigning {@code childIds} to {@code parentRoleId} would create an inheritance cycle. */
    public boolean wouldCreateCompositeCycle(UUID parentRoleId, List<UUID> childIds) {
        for (UUID childId : childIds) {
            if (parentRoleId.equals(childId)) {
                return true;
            }
            if (pathExistsFrom(childId, parentRoleId)) {
                return true;
            }
        }
        return false;
    }

    private boolean pathExistsFrom(UUID fromRoleId, UUID targetRoleId) {
        Set<UUID> visited = new HashSet<>();
        Queue<UUID> queue = new ArrayDeque<>();
        queue.add(fromRoleId);
        while (!queue.isEmpty()) {
            UUID current = queue.poll();
            if (!visited.add(current)) {
                continue;
            }
            if (current.equals(targetRoleId)) {
                return true;
            }
            queue.addAll(findChildRoleIdsByParentId(current));
        }
        return false;
    }
}
