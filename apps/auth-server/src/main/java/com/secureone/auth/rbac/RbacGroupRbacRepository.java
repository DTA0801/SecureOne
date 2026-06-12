package com.secureone.auth.rbac;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class RbacGroupRbacRepository {

    private final JdbcTemplate jdbc;

    public RbacGroupRbacRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<UUID> findRoleIdsByGroupId(UUID groupId) {
        return jdbc.queryForList(
                "SELECT role_id FROM rbac_group_role WHERE group_id = ? ORDER BY role_id",
                UUID.class,
                groupId);
    }

    public List<UUID> findMemberUserIdsByGroupId(UUID groupId) {
        return jdbc.queryForList(
                "SELECT user_id FROM rbac_group_member WHERE group_id = ? ORDER BY added_at DESC",
                UUID.class,
                groupId);
    }

    public int countRoles(UUID groupId) {
        Integer count =
                jdbc.queryForObject(
                        "SELECT COUNT(*) FROM rbac_group_role WHERE group_id = ?", Integer.class, groupId);
        return count != null ? count : 0;
    }

    public int countMembers(UUID groupId) {
        Integer count =
                jdbc.queryForObject(
                        "SELECT COUNT(*) FROM rbac_group_member WHERE group_id = ?", Integer.class, groupId);
        return count != null ? count : 0;
    }

    public int countGroupsUsingRole(UUID roleId) {
        Integer count =
                jdbc.queryForObject(
                        "SELECT COUNT(DISTINCT group_id) FROM rbac_group_role WHERE role_id = ?",
                        Integer.class,
                        roleId);
        return count != null ? count : 0;
    }

    public void replaceRoles(UUID groupId, List<UUID> roleIds) {
        jdbc.update("DELETE FROM rbac_group_role WHERE group_id = ?", groupId);
        for (UUID roleId : roleIds) {
            jdbc.update(
                    "INSERT INTO rbac_group_role (group_id, role_id) VALUES (?, ?) ON CONFLICT DO NOTHING",
                    groupId,
                    roleId);
        }
    }

    public void replaceMembers(UUID groupId, List<UUID> userIds) {
        jdbc.update("DELETE FROM rbac_group_member WHERE group_id = ?", groupId);
        Timestamp now = Timestamp.from(Instant.now());
        for (UUID userId : userIds) {
            jdbc.update(
                    "INSERT INTO rbac_group_member (group_id, user_id, added_at) VALUES (?, ?, ?) ON CONFLICT DO NOTHING",
                    groupId,
                    userId,
                    now);
        }
    }

    public List<RoleRef> findRolesByGroupId(UUID groupId) {
        return jdbc.query(
                """
                SELECT r.id, r.name
                FROM rbac_group_role gr
                JOIN role r ON r.id = gr.role_id
                WHERE gr.group_id = ?
                ORDER BY r.name
                """,
                (rs, rowNum) -> new RoleRef(UUID.fromString(rs.getString("id")), rs.getString("name")),
                groupId);
    }

    public record GroupMemberRef(UUID userId, Instant addedAt) {}

    public List<GroupMemberRef> findMembersByGroupId(UUID groupId) {
        return jdbc.query(
                """
                SELECT user_id, added_at
                FROM rbac_group_member
                WHERE group_id = ?
                ORDER BY added_at DESC
                """,
                (rs, rowNum) -> new GroupMemberRef(
                        UUID.fromString(rs.getString("user_id")), rs.getTimestamp("added_at").toInstant()),
                groupId);
    }
}
