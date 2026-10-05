package com.hobby.hub.repository;

import com.hobby.hub.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class UserRepository {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public boolean validateUser(String identifier, String password) {
        String sql = "SELECT COUNT(*) FROM users\n" +
                "WHERE (LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?))\n" +
                "AND password = ?\n" +
                "AND is_banned = FALSE";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, identifier, identifier, password);
        return count != null && count > 0;
    }

    public boolean isAdmin(Long userId) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM users WHERE id = ? AND is_admin = TRUE",
                Integer.class,
                userId
        );

        return count != null && count > 0;
    }

    public boolean banUser(Long userId) {
        int rows = jdbcTemplate.update(
                "UPDATE users SET is_banned = TRUE WHERE id = ?",
                userId
        );

        return rows > 0;
    }

    public boolean unbanUser(Long userId) {
        int rows = jdbcTemplate.update(
                "UPDATE users SET is_banned = FALSE WHERE id = ?",
                userId
        );

        return rows > 0;
    }

    public Long findIdByUsernameOrEmail(String identifier) {
        List<Long> ids = jdbcTemplate.query(
                "SELECT id FROM users WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)",
                (rs, rowNum) -> rs.getLong("id"),
                identifier, identifier
        );
        return ids.isEmpty() ? null : ids.get(0);
    }

    public String findUsernameByIdentifier(String identifier) {
        List<String> usernames = jdbcTemplate.query(
                "SELECT username FROM users WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)",
                (rs, rowNum) -> rs.getString("username"),
                identifier, identifier
        );
        return usernames.isEmpty() ? identifier : usernames.get(0);
    }

    public boolean userExists(String username, String email) {
        if (email != null && !email.isBlank()) {
            String sql = "SELECT COUNT(*) FROM users WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)";
            Integer count = jdbcTemplate.queryForObject(sql, Integer.class, username, email);
            return count != null && count > 0;
        } else {
            String sql = "SELECT COUNT(*) FROM users WHERE LOWER(username) = LOWER(?)";
            Integer count = jdbcTemplate.queryForObject(sql, Integer.class, username);
            return count != null && count > 0;
        }
    }

    public boolean registerUser(String email, String username, String password) {
        if (userExists(username, email)) {
            return false;
        }
        String sql = "INSERT INTO users (email, username, password) VALUES (?, ?, ?)";
        int rows = jdbcTemplate.update(sql, email, username, password);
        return rows > 0;
    }

    public Long findOrCreateGoogleUser(String googleId, String email, String suggestedUsername) {
        Optional<Long> existingByGoogleId = jdbcTemplate.query(
                "SELECT id FROM users WHERE google_id = ?",
                (rs, rowNum) -> rs.getLong("id"),
                googleId
        ).stream().findFirst();
        if (existingByGoogleId.isPresent()) {
            return existingByGoogleId.get();
        }

        Optional<Long> existingByEmail = jdbcTemplate.query(
                "SELECT id FROM users WHERE email = ?",
                (rs, rowNum) -> rs.getLong("id"),
                email
        ).stream().findFirst();
        if (existingByEmail.isPresent()) {
            jdbcTemplate.update("UPDATE users SET google_id = ? WHERE id = ?", googleId, existingByEmail.get());
            return existingByEmail.get();
        }

        String username = uniqueUsernameFrom(suggestedUsername);
        jdbcTemplate.update(
                "INSERT INTO users (username, email, google_id) VALUES (?, ?, ?)",
                username, email, googleId
        );
        return jdbcTemplate.queryForObject("SELECT id FROM users WHERE google_id = ?", Long.class, googleId);
    }

    private String uniqueUsernameFrom(String base) {
        String candidate = base;
        int suffix = 1;
        while (userExists(candidate, null)) {
            candidate = base + suffix;
            suffix++;
        }
        return candidate;
    }

    public Optional<User> findById(Long id) {
        return jdbcTemplate.query(
                "SELECT id, username, email, google_id, is_admin, is_banned, COALESCE(deleted_posts_count, 0) AS deleted_posts_count, selected_hobbies FROM users WHERE id = ?",
                (rs, rowNum) -> {
                    User user = new User();
                    user.setId(rs.getLong("id"));
                    user.setUsername(rs.getString("username"));
                    user.setEmail(rs.getString("email"));
                    user.setGoogleId(rs.getString("google_id"));
                    user.setAdmin(rs.getBoolean("is_admin"));
                    user.setBanned(rs.getBoolean("is_banned"));
                    user.setDeletedPostsCount(rs.getInt("deleted_posts_count"));
                    user.setSelectedHobbies(rs.getString("selected_hobbies"));
                    return user;
                },
                id
        ).stream().findFirst();
    }

    public void incrementDeletedPosts(Long userId) {
        if (userId != null) {
            jdbcTemplate.update(
                    "UPDATE users SET deleted_posts_count = COALESCE(deleted_posts_count, 0) + 1 WHERE id = ?",
                    userId
            );
        }
    }

    public void updateSelectedHobbies(Long userId, String hobbies) {
        if (userId != null) {
            jdbcTemplate.update(
                    "UPDATE users SET selected_hobbies = ? WHERE id = ?",
                    hobbies, userId
            );
        }
    }
}