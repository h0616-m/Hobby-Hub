package com.hobby.hub.controller;

import com.hobby.hub.model.Post;
import com.hobby.hub.repository.PostRepository;
import com.hobby.hub.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private boolean isAdmin(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        return userId != null && userRepository.isAdmin(userId);
    }

    @GetMapping("/users")
    public ResponseEntity<?> getUsers(
            @RequestParam(required = false) String query,
            HttpSession session) {

        if (!isAdmin(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("status", "ERROR", "message", "Admin access required"));
        }

        String sql = "SELECT u.id, u.username, COALESCE(u.email, '') AS email, " +
                "u.is_admin, u.is_banned, " +
                "COUNT(DISTINCT p.id) AS active_posts, " +
                "COALESCE(u.deleted_posts_count, 0) AS deleted_posts, " +
                "COUNT(DISTINCT c.id) AS comments_count " +
                "FROM users u " +
                "LEFT JOIN posts p ON p.user_id = u.id " +
                "LEFT JOIN comments c ON c.user_id = u.id ";

        boolean hasQuery = query != null && !query.isBlank();
        if (hasQuery) {
            sql += "WHERE LOWER(u.username) LIKE LOWER(?) OR LOWER(u.email) LIKE LOWER(?) ";
        }
        sql += "GROUP BY u.id, u.username, u.email, u.is_admin, u.is_banned, u.deleted_posts_count ORDER BY u.id ASC";

        List<Map<String, Object>> users;
        if (hasQuery) {
            String pattern = "%" + query.trim() + "%";
            users = jdbcTemplate.query(sql, (rs, rowNum) -> {
                Map<String, Object> map = new LinkedHashMap<>();
                map.put("id", rs.getLong("id"));
                map.put("username", rs.getString("username"));
                map.put("email", rs.getString("email"));
                map.put("isAdmin", rs.getBoolean("is_admin"));
                map.put("isBanned", rs.getBoolean("is_banned"));
                map.put("role", rs.getBoolean("is_admin") ? "ADMIN" : "USER");
                map.put("activePosts", rs.getInt("active_posts"));
                map.put("deletedPosts", rs.getInt("deleted_posts"));
                map.put("commentsCount", rs.getInt("comments_count"));
                return map;
            }, pattern, pattern);
        } else {
            users = jdbcTemplate.query(sql, (rs, rowNum) -> {
                Map<String, Object> map = new LinkedHashMap<>();
                map.put("id", rs.getLong("id"));
                map.put("username", rs.getString("username"));
                map.put("email", rs.getString("email"));
                map.put("isAdmin", rs.getBoolean("is_admin"));
                map.put("isBanned", rs.getBoolean("is_banned"));
                map.put("role", rs.getBoolean("is_admin") ? "ADMIN" : "USER");
                map.put("activePosts", rs.getInt("active_posts"));
                map.put("deletedPosts", rs.getInt("deleted_posts"));
                map.put("commentsCount", rs.getInt("comments_count"));
                return map;
            });
        }

        return ResponseEntity.ok(users);
    }

    @GetMapping("/analytics/hobbies")
    public ResponseEntity<?> getHobbyAnalytics(HttpSession session) {
        if (!isAdmin(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("status", "ERROR", "message", "Admin access required"));
        }

        List<String> standardHobbies = List.of("Coding", "Chess", "Drawing", "Gaming", "Music", "Fitness");
        Map<String, String> hobbyIcons = Map.of(
                "Coding", "💻",
                "Chess", "♟️",
                "Drawing", "🎨",
                "Gaming", "🎮",
                "Music", "🎵",
                "Fitness", "🏋️"
        );

        String statsSql = "SELECT p.hobby, " +
                "COUNT(DISTINCT p.id) AS post_volume, " +
                "COUNT(DISTINCT c.id) AS comment_count, " +
                "COALESCE(SUM(CASE WHEN pv.direction = 1 THEN 1 ELSE 0 END), 0) AS upvotes, " +
                "COALESCE(SUM(CASE WHEN pv.direction = -1 THEN 1 ELSE 0 END), 0) AS downvotes, " +
                "COUNT(DISTINCT p.user_id) AS active_creators " +
                "FROM posts p " +
                "LEFT JOIN comments c ON c.post_id = p.id " +
                "LEFT JOIN post_votes pv ON pv.post_id = p.id " +
                "GROUP BY p.hobby";

        Map<String, Map<String, Object>> statsMap = new HashMap<>();
        jdbcTemplate.query(statsSql, rs -> {
            String hobby = rs.getString("hobby");
            Map<String, Object> data = new HashMap<>();
            data.put("postVolume", rs.getInt("post_volume"));
            data.put("commentCount", rs.getInt("comment_count"));
            data.put("upvotes", rs.getInt("upvotes"));
            data.put("downvotes", rs.getInt("downvotes"));
            data.put("activeCreators", rs.getInt("active_creators"));
            statsMap.put(hobby, data);
        });

        String topSql = "WITH ranked AS (" +
                "  SELECT p.hobby, u.username, COUNT(p.id) AS post_count, " +
                "  ROW_NUMBER() OVER(PARTITION BY p.hobby ORDER BY COUNT(p.id) DESC) as rn " +
                "  FROM posts p " +
                "  JOIN users u ON u.id = p.user_id " +
                "  GROUP BY p.hobby, u.username " +
                ") " +
                "SELECT hobby, username, post_count FROM ranked WHERE rn = 1";

        Map<String, Map<String, Object>> topMap = new HashMap<>();
        jdbcTemplate.query(topSql, rs -> {
            String hobby = rs.getString("hobby");
            topMap.put(hobby, Map.of(
                    "username", rs.getString("username"),
                    "postCount", rs.getInt("post_count")
            ));
        });

        List<Map<String, Object>> result = new ArrayList<>();
        for (String hobby : standardHobbies) {
            Map<String, Object> stats = statsMap.getOrDefault(hobby, Map.of(
                    "postVolume", 0,
                    "commentCount", 0,
                    "upvotes", 0,
                    "downvotes", 0,
                    "activeCreators", 0
            ));

            int postVolume = (int) stats.get("postVolume");
            int commentCount = (int) stats.get("commentCount");
            int upvotes = (int) stats.get("upvotes");
            int downvotes = (int) stats.get("downvotes");
            int activeCreators = (int) stats.get("activeCreators");
            int totalVotes = upvotes + downvotes;
            int likeRatio = totalVotes > 0 ? (int) Math.round((upvotes * 100.0) / totalVotes) : 100;

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", hobby);
            item.put("label", hobby);
            item.put("icon", hobbyIcons.getOrDefault(hobby, "📌"));
            item.put("postVolume", postVolume);
            item.put("commentCount", commentCount);
            item.put("upvotes", upvotes);
            item.put("downvotes", downvotes);
            item.put("totalVotes", totalVotes);
            item.put("likeRatio", likeRatio);
            item.put("activeCreators", activeCreators);
            item.put("topContributor", topMap.get(hobby));
            result.add(item);
        }

        return ResponseEntity.ok(result);
    }

    @PostMapping("/users/{id}/ban")
    public ResponseEntity<?> banUser(
            @PathVariable Long id,
            HttpSession session) {

        if (!isAdmin(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("status", "ERROR", "message", "Admin access required"));
        }

        if (userRepository.isAdmin(id)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("status", "ERROR", "message", "Admin accounts cannot be banned"));
        }

        boolean success = userRepository.banUser(id);

        if (!success) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("status", "ERROR", "message", "User not found"));
        }

        return ResponseEntity.ok(
                Map.of("status", "SUCCESS", "message", "User banned successfully")
        );
    }

    @PostMapping("/users/{id}/unban")
    public ResponseEntity<?> unbanUser(
            @PathVariable Long id,
            HttpSession session) {

        if (!isAdmin(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("status", "ERROR", "message", "Admin access required"));
        }

        boolean success = userRepository.unbanUser(id);

        if (!success) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("status", "ERROR", "message", "User not found"));
        }

        return ResponseEntity.ok(
                Map.of("status", "SUCCESS", "message", "User unbanned successfully")
        );
    }

    @DeleteMapping("/posts/{id}")
    public ResponseEntity<?> deletePost(
            @PathVariable Long id,
            HttpSession session) {

        if (!isAdmin(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("status", "ERROR", "message", "Admin access required"));
        }

        Post post = postRepository.findById(id, null);
        if (post != null && post.getUserId() != null) {
            userRepository.incrementDeletedPosts(post.getUserId());
        }

        boolean success = postRepository.deleteById(id);

        if (!success) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("status", "ERROR", "message", "Post not found"));
        }

        return ResponseEntity.ok(
                Map.of("status", "SUCCESS", "message", "Post deleted successfully")
        );
    }
}
