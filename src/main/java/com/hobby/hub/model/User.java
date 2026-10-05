package com.hobby.hub.model;

public class User {
    private Long id;
    private String username;
    private String password;
    private String email;
    private String googleId;
    private boolean admin;
    private boolean banned;

    public User() {}

    public User(Long id, String username, String password) {
        this.id = id;
        this.username = username;
        this.password = password;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getGoogleId() { return googleId; }
    public void setGoogleId(String googleId) { this.googleId = googleId; }

    public boolean isAdmin() {
        return admin;
    }

    public void setAdmin(boolean admin) {
        this.admin = admin;
    }

    public boolean isBanned() {
        return banned;
    }

    public void setBanned(boolean banned) {
        this.banned = banned;
    }

    private int deletedPostsCount;
    private String selectedHobbies;

    public int getDeletedPostsCount() { return deletedPostsCount; }
    public void setDeletedPostsCount(int deletedPostsCount) { this.deletedPostsCount = deletedPostsCount; }

    public String getSelectedHobbies() { return selectedHobbies; }
    public void setSelectedHobbies(String selectedHobbies) { this.selectedHobbies = selectedHobbies; }

}