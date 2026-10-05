INSERT INTO users (username, password, email, is_admin)
VALUES ('admin', 'admin123', 'admin@gmail.com', TRUE)
ON CONFLICT (username) DO UPDATE SET email = 'admin@gmail.com', password = 'admin123', is_admin = TRUE;
