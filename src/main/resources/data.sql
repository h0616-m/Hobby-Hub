INSERT INTO users (username, password, is_admin)
VALUES ('admin', 'admin123', TRUE)
ON CONFLICT (username) DO UPDATE SET is_admin = TRUE;
