package com.hobby.hub.dto;

public class VoteRequest {
    private String direction; // "up" or "down"

    public VoteRequest() {}

    public String getDirection() { return direction; }
    public void setDirection(String direction) { this.direction = direction; }
}
