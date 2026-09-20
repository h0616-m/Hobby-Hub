package com.hobby.hub.controller;

import com.hobby.hub.dto.PostRequest;
import com.hobby.hub.model.Post;
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

    @GetMapping
    public List<Post> getAllPosts() {
        return postRepository.findAll();
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
}
