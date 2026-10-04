package com.hobby.hub.dto;

public class PostRequest {
    private String title;
    private String body;
    private String hobby;

    public PostRequest() {}

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getHobby() { return hobby; }
    public void setHobby(String hobby) { this.hobby = hobby; }

    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }
}
