package com.hobby.hub.model;

import java.time.LocalDateTime;
import java.util.List;

public class Post {
    private Long id;
    private Long userId;
    private String author;
    private String title;
    private String body;
    private String hobby;
    private LocalDateTime createdAt;
    private int upvotes;
    private String userVote;
    private List<Comment> comments;

    public Post() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getHobby() { return hobby; }
    public void setHobby(String hobby) { this.hobby = hobby; }

    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public int getUpvotes() { return upvotes; }
    public void setUpvotes(int upvotes) { this.upvotes = upvotes; }

    public String getUserVote() { return userVote; }
    public void setUserVote(String userVote) { this.userVote = userVote; }

    public List<Comment> getComments() { return comments; }
    public void setComments(List<Comment> comments) { this.comments = comments; }
}
