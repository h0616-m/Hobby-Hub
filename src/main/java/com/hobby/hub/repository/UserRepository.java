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
        String sql = "SELECT COUNT(*) FROM users WHERE (username = ? OR email = ?) AND password = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, identifier, identifier, password);
        return count != null && count > 0;
    }

    public Long findIdByUsernameOrEmail(String identifier) {
        List<Long> ids = jdbcTemplate.query(
                "SELECT id FROM users WHERE username = ? OR email = ?",
                (rs, rowNum) -> rs.getLong("id"),
                identifier, identifier
        );
        return ids.isEmpty() ? null : ids.get(0);
    }

    public String findUsernameByIdentifier(String identifier) {
        List<String> usernames = jdbcTemplate.query(
                "SELECT username FROM users WHERE username = ? OR email = ?",
                (rs, rowNum) -> rs.getString("username"),
                identifier, identifier
        );
        return usernames.isEmpty() ? identifier : usernames.get(0);
    }

    public boolean userExists(String username, String email) {
        if (email != null && !email.isBlank()) {
            String sql = "SELECT COUNT(*) FROM users WHERE username = ? OR email = ?";
            Integer count = jdbcTemplate.queryForObject(sql, Integer.class, username, email);
            return count != null && count > 0;
        } else {
            String sql = "SELECT COUNT(*) FROM users WHERE username = ?";
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
                "SELECT id, username, email, google_id FROM users WHERE id = ?",
                (rs, rowNum) -> {
                    User user = new User();
                    user.setId(rs.getLong("id"));
                    user.setUsername(rs.getString("username"));
                    user.setEmail(rs.getString("email"));
                    user.setGoogleId(rs.getString("google_id"));
                    return user;
                },
                id
        ).stream().findFirst();
    }
}