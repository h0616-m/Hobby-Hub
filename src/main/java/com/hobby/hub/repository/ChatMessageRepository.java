package com.hobby.hub.repository;

import com.hobby.hub.model.ChatMessage;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public class ChatMessageRepository {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final RowMapper<ChatMessage> rowMapper = new RowMapper<>() {
        @Override
        public ChatMessage mapRow(ResultSet rs, int rowNum) throws SQLException {
            ChatMessage msg = new ChatMessage();
            msg.setId(rs.getLong("id"));
            msg.setHobby(rs.getString("hobby"));
            long uid = rs.getLong("user_id");
            if (!rs.wasNull()) {
                msg.setUserId(uid);
            }
            msg.setAuthor(rs.getString("author"));
            msg.setText(rs.getString("text"));
            Timestamp ts = rs.getTimestamp("created_at");
            if (ts != null) {
                msg.setCreatedAt(ts.toLocalDateTime());
            }
            return msg;
        }
    };

    @PostConstruct
    public void init() {
        try {
            jdbcTemplate.execute(
                "CREATE TABLE IF NOT EXISTS chat_messages (" +
                "id BIGSERIAL PRIMARY KEY, " +
                "hobby VARCHAR(50) NOT NULL, " +
                "user_id BIGINT REFERENCES users(id) ON DELETE SET NULL, " +
                "author VARCHAR(100) NOT NULL, " +
                "text TEXT NOT NULL, " +
                "created_at TIMESTAMP NOT NULL DEFAULT NOW()" +
                ")"
            );
            jdbcTemplate.execute(
                "CREATE INDEX IF NOT EXISTS idx_chat_messages_hobby ON chat_messages(hobby, created_at)"
            );

            Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM chat_messages", Integer.class);
            if (count != null && count == 0) {
                save("Coding", null, "coder_pro", "Anyone using Rust for backend now?");
                save("Coding", null, "js_ninja", "Still on Node here, works fine.");
                save("Chess", null, "queens_gambit", "Sicilian or Caro-Kann against e4?");
                save("Drawing", null, "inkwell_art", "Working on a new piece tonight.");
                save("Gaming", null, "pixel_hunter", "Anyone up for ranked later?");
                save("Music", null, "vinyl_lover", "New audio interface came in today.");
                save("Fitness", null, "iron_will", "Leg day tomorrow, who's in?");
            }
        } catch (Exception e) {
            System.err.println("Notice: Chat table init check: " + e.getMessage());
        }
    }

    public List<ChatMessage> findByHobby(String hobby, int limit) {
        String sql = "SELECT id, hobby, user_id, author, text, created_at FROM chat_messages " +
                     "WHERE LOWER(hobby) = LOWER(?) ORDER BY created_at ASC LIMIT ?";
        return jdbcTemplate.query(sql, rowMapper, hobby, limit);
    }

    public ChatMessage save(String hobby, Long userId, String author, String text) {
        String sql = "INSERT INTO chat_messages (hobby, user_id, author, text, created_at) " +
                     "VALUES (?, ?, ?, ?, NOW()) RETURNING id, created_at";
        return jdbcTemplate.queryForObject(sql, (rs, rowNum) -> {
            ChatMessage msg = new ChatMessage();
            msg.setId(rs.getLong("id"));
            msg.setHobby(hobby);
            msg.setUserId(userId);
            msg.setAuthor(author);
            msg.setText(text);
            Timestamp ts = rs.getTimestamp("created_at");
            if (ts != null) {
                msg.setCreatedAt(ts.toLocalDateTime());
            }
            return msg;
        }, hobby, userId, author, text);
    }
}
