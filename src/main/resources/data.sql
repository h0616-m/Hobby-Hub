INSERT INTO users (username, password)
VALUES ('admin', 'admin123')
ON CONFLICT (username) DO NOTHING;
