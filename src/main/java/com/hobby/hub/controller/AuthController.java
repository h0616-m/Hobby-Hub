package com.hobby.hub.controller;

import com.hobby.hub.dto.LoginRequest;
import com.hobby.hub.dto.SignupRequest;
import com.hobby.hub.repository.UserRepository;
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
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        boolean isValid = userRepository.validateUser(request.getUsername(), request.getPassword());

        if (isValid) {
            return ResponseEntity.ok(Map.of(
                    "status", "SUCCESS",
                    "message", "Login successful!",
                    "username", request.getUsername()
            ));
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "status", "ERROR",
                            "message", "Invalid username or password"
                    ));
        }
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignupRequest request) {
        boolean isCreated = userRepository.registerUser(request.getUsername(), request.getPassword());

        if (isCreated) {
            return ResponseEntity.ok(Map.of(
                    "status", "SUCCESS",
                    "message", "Signup successful!",
                    "username", request.getUsername()
            ));
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "status", "ERROR",
                            "message", "Username already exists"
                    ));
        }
    }
}