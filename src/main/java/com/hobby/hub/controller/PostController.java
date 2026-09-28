package com.hobby.hub.controller;

import com.hobby.hub.dto.CommentRequest;
import com.hobby.hub.dto.PostRequest;
import com.hobby.hub.dto.VoteRequest;
import com.hobby.hub.model.Comment;
import com.hobby.hub.model.Post;
import com.hobby.hub.repository.CommentRepository;
import com.hobby.hub.repository.PostRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private CommentRepository commentRepository;

    @GetMapping
    public List<Post> getAllPosts(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        return postRepository.findAll(userId);
    }

    @PostMapping
    public ResponseEntity<?> createPost(@RequestBody PostRequest request, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("status", "ERROR", "message", "You must be logged in to post"));
        }
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("status", "ERROR", "message", "Title is required"));
        }

        Post post = postRepository.create(userId, request.getTitle(), request.getBody());
        return ResponseEntity.ok(post);
    }

    @PostMapping("/{id}/vote")
    public ResponseEntity<?> vote(@PathVariable Long id, @RequestBody VoteRequest request, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("status", "ERROR", "message", "You must be logged in to vote"));
        }
        int direction = "up".equalsIgnoreCase(request.getDirection()) ? 1 : -1;
        postRepository.vote(id, userId, direction);
        return ResponseEntity.ok(postRepository.findById(id, userId));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<?> addComment(@PathVariable Long id, @RequestBody CommentRequest request, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("status", "ERROR", "message", "You must be logged in to comment"));
        }
        if (request.getText() == null || request.getText().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("status", "ERROR", "message", "Comment text is required"));
        }
        Comment comment = commentRepository.create(id, userId, request.getText().trim());
        return ResponseEntity.ok(comment);
    }
}
