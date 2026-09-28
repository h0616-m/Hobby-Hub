package com.hobby.hub.repository;

import com.hobby.hub.model.Comment;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class CommentRepository {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private static final String SELECT_WITH_AUTHOR =
            "SELECT c.id, c.post_id, c.body, u.username AS author " +
            "FROM comments c JOIN users u ON u.id = c.user_id ";

    public List<Comment> findByPostId(Long postId) {
        return jdbcTemplate.query(
                SELECT_WITH_AUTHOR + "WHERE c.post_id = ? ORDER BY c.created_at ASC",
                this::mapRow, postId
        );
    }

    public Comment create(Long postId, Long userId, String text) {
        Long id = jdbcTemplate.queryForObject(
                "INSERT INTO comments (post_id, user_id, body) VALUES (?, ?, ?) RETURNING id",
                Long.class, postId, userId, text
        );
        return jdbcTemplate.queryForObject(
                SELECT_WITH_AUTHOR + "WHERE c.id = ?",
                this::mapRow, id
        );
    }

    private Comment mapRow(java.sql.ResultSet rs, int rowNum) throws java.sql.SQLException {
        Comment c = new Comment();
        c.setId(rs.getLong("id"));
        c.setPostId(rs.getLong("post_id"));
        c.setAuthor(rs.getString("author"));
        c.setText(rs.getString("body"));
        return c;
    }
}
