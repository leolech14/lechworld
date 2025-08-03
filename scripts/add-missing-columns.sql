-- Add missing columns to match the application schema

-- Add missing columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_first_login BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE;

-- Update existing users to have is_first_login = false since they have passwords
UPDATE users SET is_first_login = false WHERE password IS NOT NULL;