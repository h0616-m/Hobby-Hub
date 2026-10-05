package com.hobby.hub.model;

import java.time.LocalDateTime;

public class ChatMessage {
    private Long id;
    private String hobby;
    private Long userId;
    private String author;
    private String text;
    private LocalDateTime createdAt;

    public ChatMessage() {}

    public ChatMessage(Long id, String hobby, Long userId, String author, String text, LocalDateTime createdAt) {
        this.id = id;
        this.hobby = hobby;
        this.userId = userId;
        this.author = author;
        this.text = text;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getHobby() { return hobby; }
    public void setHobby(String hobby) { this.hobby = hobby; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
