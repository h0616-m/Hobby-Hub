package com.hobby.hub.dto;

public class PostRequest {
    private String title;
    private String body;

    public PostRequest() {}

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }
}
