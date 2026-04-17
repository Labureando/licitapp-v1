-- Add google_id column to users table
ALTER TABLE users ADD COLUMN google_id VARCHAR(255) UNIQUE NULL;

-- Add index for faster lookups
CREATE INDEX idx_users_google_id ON users(google_id);
