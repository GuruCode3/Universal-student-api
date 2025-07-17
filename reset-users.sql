-- Delete all users
DELETE FROM users;

-- Reset auto-increment counter  
DELETE FROM sqlite_sequence WHERE name='users';

-- Insert fresh demo users
INSERT INTO users (username, email, password_hash, first_name, last_name, role, is_active, created_at, updated_at)
VALUES 
('demo', 'demo@example.com', '$2b$10$N9qo8uLOickgx2ZMRZoMye/hgcAlQe7GUJl7G6iEWpKXpMLOG3.h2', 'Demo', 'User', 'user', 1, datetime('now'), datetime('now')),
('teacher', 'teacher@example.com', '$2b$10$N9qo8uLOickgx2ZMRZoMye/hgcAlQe7GUJl7G6iEWpKXpMLOG3.h2', 'Teacher', 'Demo', 'admin', 1, datetime('now'), datetime('now'));

-- Check result
SELECT * FROM users;