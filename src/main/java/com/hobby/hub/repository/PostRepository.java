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

    @Autowired
    private CommentRepository commentRepository;

    private static final String SELECT_WITH_AUTHOR =
            "SELECT p.id, p.user_id, p.title, p.body, p.hobby, p.created_at, u.username AS author, " +
            "COALESCE((SELECT SUM(direction) FROM post_votes WHERE post_id = p.id), 0) AS upvotes, " +
            "(SELECT direction FROM post_votes WHERE post_id = p.id AND user_id = ?) AS user_vote " +
            "FROM posts p JOIN users u ON u.id = p.user_id ";

    public List<Post> findAll(Long currentUserId) {
        List<Post> posts = jdbcTemplate.query(
                SELECT_WITH_AUTHOR + "WHERE u.is_banned = FALSE ORDER BY p.created_at DESC",
                this::mapRow, currentUserId
        );
        posts.forEach(p -> p.setComments(commentRepository.findByPostId(p.getId())));
        return posts;
    }

    public Post create(Long userId, String title, String body, String hobby) {
        Long id = jdbcTemplate.queryForObject(
                "INSERT INTO posts (user_id, title, body, hobby) VALUES (?, ?, ?, ?) RETURNING id",
                Long.class, userId, title, body, hobby
        );
        return findById(id, userId);
    }

    public Post findById(Long id, Long currentUserId) {
        Post post = jdbcTemplate.queryForObject(
                SELECT_WITH_AUTHOR + "WHERE p.id = ?",
                this::mapRow, currentUserId, id
        );
        post.setComments(commentRepository.findByPostId(id));
        return post;
    }

    /** direction: +1 for upvote, -1 for downvote. Clicking the same direction again removes the vote. */
    public void vote(Long postId, Long userId, int direction) {
        Integer existing = jdbcTemplate.query(
                "SELECT direction FROM post_votes WHERE post_id = ? AND user_id = ?",
                (rs, rowNum) -> rs.getInt("direction"),
                postId, userId
        ).stream().findFirst().orElse(null);

        if (existing == null) {
            jdbcTemplate.update(
                    "INSERT INTO post_votes (post_id, user_id, direction) VALUES (?, ?, ?)",
                    postId, userId, direction
            );
        } else if (existing == direction) {
            jdbcTemplate.update(
                    "DELETE FROM post_votes WHERE post_id = ? AND user_id = ?",
                    postId, userId
            );
        } else {
            jdbcTemplate.update(
                    "UPDATE post_votes SET direction = ? WHERE post_id = ? AND user_id = ?",
                    direction, postId, userId
            );
        }
    }

    private Post mapRow(java.sql.ResultSet rs, int rowNum) throws java.sql.SQLException {
        Post post = new Post();
        post.setId(rs.getLong("id"));
        post.setUserId(rs.getLong("user_id"));
        post.setTitle(rs.getString("title"));
        post.setBody(rs.getString("body"));
        post.setHobby(rs.getString("hobby"));
        post.setAuthor(rs.getString("author"));
        post.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
        post.setUpvotes(rs.getInt("upvotes"));
        int userVoteRaw = rs.getInt("user_vote");
        boolean noVote = rs.wasNull();
        post.setUserVote(noVote ? null : (userVoteRaw > 0 ? "up" : "down"));
        return post;
    }

    public boolean deleteById(Long postId) {
        int rows = jdbcTemplate.update(
                "DELETE FROM posts WHERE id = ?",
                postId
        );

        return rows > 0;
    }
}
