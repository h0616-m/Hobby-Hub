package com.hobby.hub.controller;

import com.hobby.hub.repository.PostRepository;
import com.hobby.hub.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

        @Autowired
        private UserRepository userRepository;

        @Autowired
        private PostRepository postRepository;

        private boolean isAdmin(HttpSession session) {
            Long userId = (Long) session.getAttribute("userId");

            return userId != null && userRepository.isAdmin(userId);
        }

        @PostMapping("/users/{id}/ban")
        public ResponseEntity<?> banUser(
                @PathVariable Long id,
                HttpSession session) {

            if (!isAdmin(session)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of(
                                "status", "ERROR",
                                "message", "Admin access required"
                        ));
            }

            boolean success = userRepository.banUser(id);

            if (!success) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of(
                                "status", "ERROR",
                                "message", "User not found"
                        ));
            }

            return ResponseEntity.ok(
                    Map.of(
                            "status", "SUCCESS",
                            "message", "User banned successfully"
                    )
            );
        }

        @DeleteMapping("/posts/{id}")
        public ResponseEntity<?> deletePost(
                @PathVariable Long id,
                HttpSession session) {

            if (!isAdmin(session)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of(
                                "status", "ERROR",
                                "message", "Admin access required"
                        ));
            }

            boolean success = postRepository.deleteById(id);

            if (!success) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of(
                                "status", "ERROR",
                                "message", "Post not found"
                        ));
            }

            return ResponseEntity.ok(
                    Map.of(
                            "status", "SUCCESS",
                            "message", "Post deleted successfully"
                    )
            );
        }
}
