package com.hobby.hub.repository;

import com.hobby.hub.model.Post;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class PostRepository {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private static final String SELECT_WITH_AUTHOR =
            "SELECT p.id, p.user_id, p.title, p.body, p.created_at, u.username AS author " +
            "FROM posts p JOIN users u ON u.id = p.user_id ";

    public List<Post> findAll() {
        return jdbcTemplate.query(
                SELECT_WITH_AUTHOR + "ORDER BY p.created_at DESC",
                this::mapRow
        );
    }

    public Post create(Long userId, String title, String body) {
        Long id = jdbcTemplate.queryForObject(
                "INSERT INTO posts (user_id, title, body) VALUES (?, ?, ?) RETURNING id",
                Long.class, userId, title, body
        );
        return jdbcTemplate.queryForObject(
                SELECT_WITH_AUTHOR + "WHERE p.id = ?",
                this::mapRow, id
        );
    }

    private Post mapRow(java.sql.ResultSet rs, int rowNum) throws java.sql.SQLException {
        Post post = new Post();
        post.setId(rs.getLong("id"));
        post.setUserId(rs.getLong("user_id"));
        post.setTitle(rs.getString("title"));
        post.setBody(rs.getString("body"));
        post.setAuthor(rs.getString("author"));
        post.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
        return post;
    }
}
