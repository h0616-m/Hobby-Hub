package com.hobby.hub.controller;

import com.hobby.hub.dto.LoginRequest;
import com.hobby.hub.dto.SignupRequest;
import com.hobby.hub.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request, HttpSession session) {
        String identifier = request.getUsername() != null && !request.getUsername().isBlank()
                ? request.getUsername()
                : request.getEmail();

        if (identifier == null || identifier.isBlank() || request.getPassword() == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("status", "ERROR", "message", "Email/username and password required"));
        }

        boolean isValid = userRepository.validateUser(identifier, request.getPassword());

        if (isValid) {
            Long userId = userRepository.findIdByUsernameOrEmail(identifier);
            String actualUsername = userRepository.findUsernameByIdentifier(identifier);
            session.setAttribute("userId", userId);
            session.setAttribute("username", actualUsername);
            return ResponseEntity.ok(Map.of(
                    "status", "SUCCESS",
                    "message", "Login successful!",
                    "username", actualUsername
            ));
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "status", "ERROR",
                            "message", "Invalid email/username or password"
                    ));
        }
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignupRequest request, HttpSession session) {
        if (request.getUsername() == null || request.getUsername().isBlank() ||
            request.getPassword() == null || request.getPassword().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("status", "ERROR", "message", "Username and password required"));
        }

        boolean isCreated = userRepository.registerUser(request.getEmail(), request.getUsername(), request.getPassword());

        if (isCreated) {
            Long userId = userRepository.findIdByUsernameOrEmail(request.getUsername());
            session.setAttribute("userId", userId);
            session.setAttribute("username", request.getUsername());
            return ResponseEntity.ok(Map.of(
                    "status", "SUCCESS",
                    "message", "Signup successful!",
                    "username", request.getUsername()
            ));
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                            "status", "ERROR",
                            "message", "Username or email already exists"
                    ));
        }
    }
}